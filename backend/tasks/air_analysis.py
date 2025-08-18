"""
UNEP Air Quality Analysis Tasks
Celery tasks for geospatial processing and policy recommendations
"""

from celery import Celery
import psycopg2
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Celery configuration
app = Celery('tasks', broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', 5432),
        database=os.getenv('DB_NAME', 'unep_air'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )

@app.task(bind=True)
def calculate_pollution_hotspots(self, bbox=None, time_window_hours=1):
    """
    Calculate pollution hotspots using spatial clustering
    Alternative to ArcPy Hot Spot Analysis for open-source implementation
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query based on parameters
        base_query = """
        SELECT 
            ST_X(geom) as longitude,
            ST_Y(geom) as latitude,
            pm25,
            no2,
            source_type,
            recorded_at
        FROM air_measurements 
        WHERE recorded_at > NOW() - INTERVAL '%s HOURS'
        AND pm25 IS NOT NULL
        """
        
        params = [time_window_hours]
        
        if bbox:
            base_query += " AND geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)"
            params.extend(bbox)
            
        base_query += " ORDER BY pm25 DESC"
        
        cursor.execute(base_query, params)
        data = cursor.fetchall()
        
        if len(data) < 5:
            return {
                "status": "insufficient_data",
                "message": "Not enough data points for hotspot analysis",
                "data_points": len(data)
            }
        
        # Convert to pandas DataFrame for analysis
        df = pd.DataFrame(data, columns=[
            'longitude', 'latitude', 'pm25', 'no2', 'source_type', 'recorded_at'
        ])
        
        # Simple hotspot detection using statistical thresholds
        hotspots = []
        
        # Calculate statistical thresholds
        pm25_mean = df['pm25'].mean()
        pm25_std = df['pm25'].std()
        threshold_high = pm25_mean + (2 * pm25_std)  # 2 standard deviations
        threshold_critical = pm25_mean + (3 * pm25_std)  # 3 standard deviations
        
        # Identify hotspots
        for _, row in df.iterrows():
            if row['pm25'] > threshold_high:
                priority = 'critical' if row['pm25'] > threshold_critical else 'high'
                
                hotspot = {
                    'longitude': float(row['longitude']),
                    'latitude': float(row['latitude']),
                    'pm25_level': float(row['pm25']),
                    'no2_level': float(row['no2']) if row['no2'] else None,
                    'source_type': row['source_type'],
                    'priority': priority,
                    'severity_score': float(row['pm25'] / pm25_mean),
                    'recorded_at': row['recorded_at'].isoformat()
                }
                hotspots.append(hotspot)
        
        # Sort by severity
        hotspots.sort(key=lambda x: x['severity_score'], reverse=True)
        
        # Update task progress
        self.update_state(state='PROGRESS', meta={'current': 80, 'total': 100})
        
        # Store results in database for caching
        insert_query = """
        INSERT INTO alert_history (alert_type, location, severity, message, pm25_level)
        VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s)
        """
        
        for hotspot in hotspots[:5]:  # Store top 5 hotspots as alerts
            cursor.execute(insert_query, (
                'hotspot_detected',
                hotspot['longitude'],
                hotspot['latitude'],
                hotspot['priority'],
                f"Pollution hotspot detected: {hotspot['pm25_level']:.1f} μg/m³ PM2.5",
                hotspot['pm25_level']
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "analysis_type": "hotspot_detection",
            "total_measurements": len(data),
            "hotspots_found": len(hotspots),
            "threshold_high": float(threshold_high),
            "threshold_critical": float(threshold_critical),
            "hotspots": hotspots[:10],  # Return top 10
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }

@app.task(bind=True)
def attribute_pollution_sources(self, grid_id):
    """
    Machine learning-based source attribution
    Identifies dominant pollution sources in a grid cell
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch data for specific grid
        query = """
        SELECT 
            am.pm25, am.pm10, am.no2, am.so2,
            am.source_type, am.recorded_at,
            ST_X(am.geom) as longitude,
            ST_Y(am.geom) as latitude
        FROM air_measurements am
        JOIN policy_grid pg ON ST_Within(am.geom, pg.geom)
        WHERE pg.grid_id = %s 
        AND am.recorded_at > NOW() - INTERVAL '24 HOURS'
        AND am.pm25 IS NOT NULL
        ORDER BY am.recorded_at DESC
        """
        
        cursor.execute(query, (grid_id,))
        data = cursor.fetchall()
        
        if len(data) < 10:
            return {
                "status": "insufficient_data",
                "grid_id": grid_id,
                "message": "Need at least 10 measurements for reliable attribution",
                "available_measurements": len(data)
            }
        
        df = pd.DataFrame(data, columns=[
            'pm25', 'pm10', 'no2', 'so2', 'source_type', 
            'recorded_at', 'longitude', 'latitude'
        ])
        
        # Source attribution using chemical signatures
        source_contributions = {
            "traffic": 0.0,
            "industry": 0.0,
            "waste_burning": 0.0,
            "background": 0.0
        }
        
        # Traffic signature: High NO2/PM2.5 ratio
        df['no2_pm_ratio'] = df['no2'] / df['pm25'].replace(0, np.nan)
        avg_no2_pm_ratio = df['no2_pm_ratio'].mean()
        
        if avg_no2_pm_ratio > 0.6:  # Typical traffic signature
            source_contributions["traffic"] = min(0.8, avg_no2_pm_ratio)
        
        # Industrial signature: High SO2 levels
        avg_so2 = df['so2'].mean()
        if avg_so2 > 20:  # μg/m³
            source_contributions["industry"] = min(0.7, avg_so2 / 50)
        
        # Waste burning: High PM2.5/PM10 ratio + temporal patterns
        df['pm_ratio'] = df['pm25'] / df['pm10'].replace(0, np.nan)
        avg_pm_ratio = df['pm_ratio'].mean()
        
        if avg_pm_ratio > 0.7:  # Fine particles dominant
            # Check for evening/night peaks (typical of waste burning)
            df['hour'] = pd.to_datetime(df['recorded_at']).dt.hour
            evening_avg = df[df['hour'].isin([18, 19, 20, 21])]['pm25'].mean()
            day_avg = df[df['hour'].isin([10, 11, 12, 13, 14])]['pm25'].mean()
            
            if evening_avg > day_avg * 1.3:
                source_contributions["waste_burning"] = 0.5
        
        # Normalize contributions
        total = sum(source_contributions.values())
        if total > 0:
            source_contributions = {k: v/total for k, v in source_contributions.items()}
        else:
            source_contributions["background"] = 1.0
        
        # Calculate confidence based on data quality and quantity
        confidence = min(1.0, len(data) / 50) * 0.8  # More data = higher confidence
        
        # Update grid with dominant source
        dominant_source = max(source_contributions, key=source_contributions.get)
        update_query = """
        UPDATE policy_grid 
        SET dominant_source = %s, last_updated = NOW()
        WHERE grid_id = %s
        """
        cursor.execute(update_query, (dominant_source, grid_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "grid_id": grid_id,
            "source_attribution": source_contributions,
            "dominant_source": dominant_source,
            "confidence": round(confidence, 2),
            "measurements_analyzed": len(data),
            "chemical_signatures": {
                "avg_no2_pm_ratio": round(avg_no2_pm_ratio, 2),
                "avg_so2": round(avg_so2, 1),
                "avg_pm_ratio": round(avg_pm_ratio, 2)
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "grid_id": grid_id,
            "message": str(e),
            "error_type": type(e).__name__
        }

@app.task(bind=True)
def generate_policy_recommendations(self, grid_id):
    """
    Generate policy recommendations based on air quality analysis
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get grid information and recent air quality data
        query = """
        SELECT 
            pg.grid_id, pg.priority_score, pg.dominant_source, pg.population_density,
            AVG(am.pm25) as avg_pm25,
            COUNT(am.id) as measurement_count
        FROM policy_grid pg
        LEFT JOIN air_measurements am ON ST_Within(am.geom, pg.geom)
        WHERE pg.grid_id = %s
        AND (am.recorded_at > NOW() - INTERVAL '24 HOURS' OR am.recorded_at IS NULL)
        GROUP BY pg.grid_id, pg.priority_score, pg.dominant_source, pg.population_density
        """
        
        cursor.execute(query, (grid_id,))
        grid_data = cursor.fetchone()
        
        if not grid_data:
            return {"status": "error", "message": "Grid not found"}
        
        grid_id, priority_score, dominant_source, population_density, avg_pm25, measurement_count = grid_data
        
        recommendations = []
        
        # Generate recommendations based on dominant source and pollution level
        if avg_pm25 and avg_pm25 > 35:  # WHO guideline threshold
            
            if dominant_source == 'traffic':
                recommendations.extend([
                    {
                        'policy_type': 'traffic_restriction',
                        'title': 'Peak-Hour Vehicle Restrictions',
                        'description': f'Implement odd-even license plate restrictions during peak hours',
                        'priority': 'high' if avg_pm25 > 55 else 'medium',
                        'expected_impact_percent': 25.0,
                        'cost_estimate': 8500.00,
                        'implementation_time_days': 30
                    },
                    {
                        'policy_type': 'low_emission_zone',
                        'title': 'Low Emission Zone',
                        'description': 'Restrict older vehicles (Euro 3 and below) from entering the zone',
                        'priority': 'medium',
                        'expected_impact_percent': 35.0,
                        'cost_estimate': 25000.00,
                        'implementation_time_days': 180
                    }
                ])
            
            elif dominant_source == 'industry':
                recommendations.extend([
                    {
                        'policy_type': 'industrial_monitoring',
                        'title': 'Continuous Emissions Monitoring',
                        'description': 'Install real-time monitoring systems on major industrial stacks',
                        'priority': 'high',
                        'expected_impact_percent': 20.0,
                        'cost_estimate': 15000.00,
                        'implementation_time_days': 90
                    },
                    {
                        'policy_type': 'emission_standards',
                        'title': 'Stricter Emission Standards',
                        'description': 'Enforce tighter emission limits for industrial facilities',
                        'priority': 'medium',
                        'expected_impact_percent': 30.0,
                        'cost_estimate': 5000.00,
                        'implementation_time_days': 120
                    }
                ])
            
            elif dominant_source == 'waste':
                recommendations.append({
                    'policy_type': 'waste_management',
                    'title': 'Enhanced Waste Collection',
                    'description': 'Increase waste collection frequency and anti-burning enforcement',
                    'priority': 'high',
                    'expected_impact_percent': 40.0,
                    'cost_estimate': 7500.00,
                    'implementation_time_days': 60
                })
        
        # Insert recommendations into database
        for rec in recommendations:
            insert_query = """
            INSERT INTO policy_recommendations 
            (grid_id, policy_type, title, description, priority, expected_impact_percent, cost_estimate, implementation_time_days)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """
            
            cursor.execute(insert_query, (
                grid_id,
                rec['policy_type'],
                rec['title'],
                rec['description'],
                rec['priority'],
                rec['expected_impact_percent'],
                rec['cost_estimate'],
                rec['implementation_time_days']
            ))
            
            rec['id'] = cursor.fetchone()[0]
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "grid_id": grid_id,
            "grid_info": {
                "priority_score": priority_score,
                "dominant_source": dominant_source,
                "population_density": population_density,
                "avg_pm25": round(avg_pm25, 1) if avg_pm25 else None
            },
            "recommendations_generated": len(recommendations),
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "grid_id": grid_id,
            "message": str(e),
            "error_type": type(e).__name__
        }

# Periodic task to update grid priorities
@app.task
def update_all_grid_priorities():
    """
    Update priority scores for all policy grids based on recent air quality data
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Call the database function to update priorities
        cursor.execute("SELECT update_grid_priorities()")
        
        # Get updated statistics
        cursor.execute("""
        SELECT 
            COUNT(*) as total_grids,
            AVG(priority_score) as avg_priority,
            MAX(priority_score) as max_priority
        FROM policy_grid
        """)
        
        stats = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "total_grids_updated": stats[0],
            "average_priority": round(stats[1], 2) if stats[1] else 0,
            "max_priority": round(stats[2], 2) if stats[2] else 0,
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }

if __name__ == '__main__':
    app.start()