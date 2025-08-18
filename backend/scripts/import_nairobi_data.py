#!/usr/bin/env python3
"""
Nairobi Air Quality Data Import Script for UNEP Platform
Imports real monitoring and intervention zone data into PostGIS database

Usage:
python import_nairobi_data.py
"""

import pandas as pd
import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class NairobiDataImporter:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', 5432),
            'database': os.getenv('DB_NAME', 'unep_air'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password')
        }
        
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)
    
    def import_monitoring_zones(self, csv_file="air_quality_monitoring_zones_one.csv"):
        """Import monitoring zone data into air_measurements table"""
        try:
            # Read CSV data
            df = pd.read_csv(csv_file)
            print(f"Loading {len(df)} monitoring locations from {csv_file}")
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Clear existing data (optional - remove if you want to keep historical data)
            # cursor.execute("DELETE FROM air_measurements WHERE source_type = 'monitoring_station'")
            
            # Insert data
            insert_query = """
            INSERT INTO air_measurements 
            (geom, pm25, source_type, recorded_at, quality_flag)
            VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """
            
            records_inserted = 0
            for _, row in df.iterrows():
                # Convert AQI category to quality flag
                quality_flag = self.aqi_to_quality_flag(row.get('AQI_Category', 'Unknown'))
                
                # Parse timestamp
                timestamp = row.get('Last_Updated', datetime.now().isoformat())
                if isinstance(timestamp, str) and 'T' in timestamp:
                    timestamp = timestamp.replace('Z', '+00:00')
                
                cursor.execute(insert_query, (
                    row['Longitude'],
                    row['Latitude'], 
                    row.get('PM25_ugm3'),
                    'monitoring_station',
                    timestamp,
                    quality_flag
                ))
                records_inserted += 1
            
            conn.commit()
            print(f"✅ Imported {records_inserted} monitoring zone records")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error importing monitoring zones: {e}")
    
    def import_intervention_zones(self, csv_file="air_quality_intervention_zone.csv"):
        """Import intervention zones into policy_grid and policy_recommendations tables"""
        try:
            # Read CSV data
            df = pd.read_csv(csv_file)
            print(f"Loading {len(df)} intervention zones from {csv_file}")
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Insert into policy_grid first
            grid_query = """
            INSERT INTO policy_grid 
            (geom, priority_score, dominant_source, last_updated)
            VALUES (ST_SetSRID(ST_Buffer(ST_MakePoint(%s, %s), 0.01), 4326), %s, %s, NOW())
            RETURNING grid_id
            """
            
            # Insert policy recommendations
            policy_query = """
            INSERT INTO policy_recommendations 
            (grid_id, policy_type, title, description, priority, expected_impact_percent, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """
            
            records_inserted = 0
            for _, row in df.iterrows():
                # Insert grid zone
                cursor.execute(grid_query, (
                    row['Longitude'],
                    row['Latitude'],
                    row.get('Priority_Score', 50),
                    row.get('Dominant_Source', 'unknown').lower()
                ))
                
                grid_id = cursor.fetchone()[0]
                
                # Parse expected impact
                impact_text = row.get('Expected_Impact', '20%')
                impact_percent = self.extract_impact_percentage(impact_text)
                
                # Determine priority from score
                priority = self.score_to_priority(row.get('Priority_Score', 50))
                
                # Insert policy recommendation
                cursor.execute(policy_query, (
                    grid_id,
                    row.get('Policy_Type', 'general').lower().replace(' ', '_'),
                    row.get('Zone_Name', f"Zone {grid_id}"),
                    f"Policy intervention for {row.get('Zone_Name', 'area')} - {row.get('Expected_Impact', 'Impact TBD')}",
                    priority,
                    impact_percent,
                    row.get('Status', 'pending').lower()
                ))
                
                records_inserted += 1
            
            conn.commit()
            print(f"✅ Imported {records_inserted} intervention zone records")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error importing intervention zones: {e}")
    
    def create_sample_alerts(self):
        """Create sample alerts based on high pollution areas"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Create alerts for high pollution areas
            alert_query = """
            INSERT INTO alert_history 
            (alert_type, location, severity, message, pm25_level, triggered_at)
            VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, NOW())
            """
            
            sample_alerts = [
                {
                    'location': [36.8581, -1.3128],  # Industrial Area
                    'pm25': 67.3,
                    'message': 'High PM2.5 levels detected in Industrial Area - Consider emission controls',
                    'severity': 'high'
                },
                {
                    'location': [36.8833, -1.3167],  # Embakasi
                    'pm25': 89.5,
                    'message': 'Very unhealthy air quality in Embakasi - Immediate intervention needed',
                    'severity': 'critical'
                },
                {
                    'location': [36.8172, -1.2864],  # CBD
                    'pm25': 45.2,
                    'message': 'Moderate pollution in CBD - Traffic restrictions recommended',
                    'severity': 'medium'
                }
            ]
            
            for alert in sample_alerts:
                cursor.execute(alert_query, (
                    'pollution_spike',
                    alert['location'][0],
                    alert['location'][1],
                    alert['severity'],
                    alert['message'],
                    alert['pm25']
                ))
            
            conn.commit()
            print(f"✅ Created {len(sample_alerts)} sample alerts")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error creating alerts: {e}")
    
    def update_grid_priorities(self):
        """Update policy grid priorities based on imported data"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Call the database function to recalculate priorities
            cursor.execute("SELECT update_grid_priorities()")
            
            # Get statistics
            cursor.execute("""
            SELECT 
                COUNT(*) as total_grids,
                AVG(priority_score) as avg_priority,
                COUNT(*) FILTER (WHERE priority_score > 80) as high_priority_zones
            FROM policy_grid
            """)
            
            stats = cursor.fetchone()
            
            conn.commit()
            print(f"✅ Updated grid priorities - {stats[2]} high-priority zones identified")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error updating grid priorities: {e}")
    
    def generate_summary_report(self):
        """Generate summary report of imported data"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Air quality summary
            cursor.execute("""
            SELECT 
                COUNT(*) as total_measurements,
                AVG(pm25) as avg_pm25,
                MAX(pm25) as max_pm25,
                COUNT(*) FILTER (WHERE pm25 > 35) as unhealthy_readings
            FROM air_measurements 
            WHERE recorded_at > NOW() - INTERVAL '24 HOURS'
            """)
            
            air_stats = cursor.fetchone()
            
            # Policy summary
            cursor.execute("""
            SELECT 
                COUNT(*) as total_recommendations,
                COUNT(*) FILTER (WHERE status = 'approved') as approved,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE priority = 'high') as high_priority
            FROM policy_recommendations
            """)
            
            policy_stats = cursor.fetchone()
            
            # Alert summary
            cursor.execute("""
            SELECT 
                COUNT(*) as total_alerts,
                COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
                COUNT(*) FILTER (WHERE status = 'active') as active_alerts
            FROM alert_history
            """)
            
            alert_stats = cursor.fetchone()
            
            print("\n" + "="*50)
            print("📊 NAIROBI AIR QUALITY DATA SUMMARY")
            print("="*50)
            print(f"🌬️  Air Quality Measurements: {air_stats[0]}")
            print(f"   Average PM2.5: {air_stats[1]:.1f} μg/m³" if air_stats[1] else "   Average PM2.5: No data")
            print(f"   Max PM2.5: {air_stats[2]:.1f} μg/m³" if air_stats[2] else "   Max PM2.5: No data")
            print(f"   Unhealthy readings: {air_stats[3]}")
            print()
            print(f"📋 Policy Recommendations: {policy_stats[0]}")
            print(f"   Approved: {policy_stats[1]}")
            print(f"   Pending: {policy_stats[2]}")
            print(f"   High Priority: {policy_stats[3]}")
            print()
            print(f"🚨 Alerts: {alert_stats[0]}")
            print(f"   Critical: {alert_stats[1]}")
            print(f"   Active: {alert_stats[2]}")
            print("="*50)
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error generating summary: {e}")
    
    # Helper methods
    def aqi_to_quality_flag(self, aqi_category):
        """Convert AQI category to quality flag"""
        mapping = {
            'Good': 1,
            'Moderate': 1,
            'Unhealthy for Sensitive Groups': 2,
            'Unhealthy': 2,
            'Very Unhealthy': 3,
            'Hazardous': 3
        }
        return mapping.get(aqi_category, 2)
    
    def extract_impact_percentage(self, impact_text):
        """Extract percentage from impact text"""
        import re
        if not impact_text:
            return 20.0
        
        # Look for percentage patterns like "25-30%" or "20%"
        match = re.search(r'(\d+)(?:-\d+)?%', str(impact_text))
        if match:
            return float(match.group(1))
        return 20.0
    
    def score_to_priority(self, score):
        """Convert priority score to priority level"""
        if score >= 90:
            return 'critical'
        elif score >= 80:
            return 'high'
        elif score >= 60:
            return 'medium'
        else:
            return 'low'

def main():
    """Main execution function"""
    print("🌍 UNEP Nairobi Air Quality Data Import")
    print("=" * 45)
    
    importer = NairobiDataImporter()
    
    # Step 1: Import monitoring zones
    print("\n1️⃣ Importing monitoring zone data...")
    importer.import_monitoring_zones()
    
    # Step 2: Import intervention zones
    print("\n2️⃣ Importing intervention zones...")
    importer.import_intervention_zones()
    
    # Step 3: Create sample alerts
    print("\n3️⃣ Creating sample alerts...")
    importer.create_sample_alerts()
    
    # Step 4: Update grid priorities
    print("\n4️⃣ Updating grid priorities...")
    importer.update_grid_priorities()
    
    # Step 5: Generate summary
    print("\n5️⃣ Generating summary report...")
    importer.generate_summary_report()
    
    print("\n✅ Data import complete!")
    print("\nNext steps:")
    print("- Start the backend API: cd backend && npm run dev")
    print("- Start the frontend: cd frontend && npm run dev")
    print("- Visit http://localhost:3000 to view the dashboard")

if __name__ == "__main__":
    main()