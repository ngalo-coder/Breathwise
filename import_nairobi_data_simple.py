#!/usr/bin/env python3
"""
Simplified Nairobi Air Quality Data Import Script
Creates JSON files that can be served by the API without requiring PostgreSQL

Usage:
python import_nairobi_data_simple.py
"""

import pandas as pd
import json
from datetime import datetime
import os

class SimpleNairobiDataImporter:
    def __init__(self):
        self.output_dir = "data"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def import_monitoring_zones(self, csv_file="air_quality_monitoring_zones_one.csv"):
        """Import monitoring zone data and create JSON"""
        try:
            # Read CSV data
            df = pd.read_csv(csv_file)
            print(f"Loading {len(df)} monitoring locations from {csv_file}")
            
            # Process data
            monitoring_zones = []
            for _, row in df.iterrows():
                zone = {
                    "id": row['Location_ID'],
                    "name": row['Location_Name'],
                    "latitude": row['Latitude'],
                    "longitude": row['Longitude'],
                    "pm25": row.get('PM25_ugm3'),
                    "aqi_category": row.get('AQI_Category', 'Unknown'),
                    "data_quality": row.get('Data_Quality', 'Medium'),
                    "last_updated": row.get('Last_Updated', datetime.now().isoformat()),
                    "geometry": {
                        "type": "Point",
                        "coordinates": [row['Longitude'], row['Latitude']]
                    },
                    "properties": {
                        "severity": self.get_severity_level(row.get('PM25_ugm3')),
                        "aqi": self.calculate_aqi(row.get('PM25_ugm3')),
                        "health_impact": self.get_health_impact(row.get('PM25_ugm3'))
                    }
                }
                monitoring_zones.append(zone)
            
            # Save as GeoJSON
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": zone["geometry"],
                        "properties": {
                            "id": zone["id"],
                            "name": zone["name"],
                            "pm25": zone["pm25"],
                            "aqi_category": zone["aqi_category"],
                            "data_quality": zone["data_quality"],
                            "last_updated": zone["last_updated"],
                            **zone["properties"]
                        }
                    }
                    for zone in monitoring_zones
                ]
            }
            
            # Save files
            with open(f"{self.output_dir}/nairobi_monitoring_zones.json", 'w') as f:
                json.dump(monitoring_zones, f, indent=2)
                
            with open(f"{self.output_dir}/nairobi_monitoring_zones.geojson", 'w') as f:
                json.dump(geojson, f, indent=2)
            
            print(f"✅ Imported {len(monitoring_zones)} monitoring zone records")
            return monitoring_zones
            
        except Exception as e:
            print(f"❌ Error importing monitoring zones: {e}")
            return []
    
    def import_intervention_zones(self, csv_file="air_quality_intervention_zone.csv"):
        """Import intervention zones and create policy recommendations"""
        try:
            # Read CSV data
            df = pd.read_csv(csv_file)
            print(f"Loading {len(df)} intervention zones from {csv_file}")
            
            # Process intervention zones
            intervention_zones = []
            policy_recommendations = []
            
            for i, row in df.iterrows():
                # Create intervention zone
                zone = {
                    "zone_id": row['Zone_ID'],
                    "zone_name": row['Zone_Name'],
                    "latitude": row['Latitude'],
                    "longitude": row['Longitude'],
                    "priority_score": row.get('Priority_Score', 50),
                    "dominant_source": row.get('Dominant_Source', 'unknown'),
                    "policy_type": row.get('Policy_Type', 'general'),
                    "expected_impact": row.get('Expected_Impact', 'TBD'),
                    "status": row.get('Status', 'pending'),
                    "geometry": {
                        "type": "Point",
                        "coordinates": [row['Longitude'], row['Latitude']]
                    }
                }
                intervention_zones.append(zone)
                
                # Create policy recommendation
                impact_percent = self.extract_impact_percentage(row.get('Expected_Impact', '20%'))
                priority = self.score_to_priority(row.get('Priority_Score', 50))
                
                policy = {
                    "id": i + 1,
                    "zone_id": row['Zone_ID'],
                    "policy_type": row.get('Policy_Type', 'general').lower().replace(' ', '_'),
                    "title": f"{row.get('Policy_Type', 'Policy')} - {row.get('Zone_Name', 'Area')}",
                    "description": f"Policy intervention for {row.get('Zone_Name', 'area')} - {row.get('Expected_Impact', 'Impact TBD')}",
                    "priority": priority,
                    "expected_impact_percent": impact_percent,
                    "cost_estimate": self.estimate_cost(row.get('Policy_Type', 'general')),
                    "implementation_time_days": self.estimate_implementation_time(row.get('Policy_Type', 'general')),
                    "status": row.get('Status', 'pending').lower(),
                    "created_at": datetime.now().isoformat(),
                    "grid_info": {
                        "geometry": zone["geometry"],
                        "priority_score": zone["priority_score"],
                        "dominant_source": zone["dominant_source"]
                    }
                }
                policy_recommendations.append(policy)
            
            # Save files
            with open(f"{self.output_dir}/nairobi_intervention_zones.json", 'w') as f:
                json.dump(intervention_zones, f, indent=2)
                
            with open(f"{self.output_dir}/nairobi_policy_recommendations.json", 'w') as f:
                json.dump(policy_recommendations, f, indent=2)
            
            print(f"✅ Imported {len(intervention_zones)} intervention zone records")
            print(f"✅ Created {len(policy_recommendations)} policy recommendations")
            
            return intervention_zones, policy_recommendations
            
        except Exception as e:
            print(f"❌ Error importing intervention zones: {e}")
            return [], []
    
    def create_sample_alerts(self, monitoring_zones):
        """Create sample alerts based on high pollution areas"""
        try:
            alerts = []
            
            for zone in monitoring_zones:
                pm25 = zone.get('pm25')
                if pm25 and pm25 > 35:  # Unhealthy levels
                    severity = 'critical' if pm25 > 75 else 'high' if pm25 > 55 else 'medium'
                    
                    alert = {
                        "id": len(alerts) + 1,
                        "alert_type": "pollution_spike",
                        "location": zone["geometry"],
                        "severity": severity,
                        "message": f"High PM2.5 levels detected in {zone['name']} - {pm25:.1f} μg/m³",
                        "pm25_level": pm25,
                        "triggered_at": datetime.now().isoformat(),
                        "status": "active",
                        "zone_name": zone["name"]
                    }
                    alerts.append(alert)
            
            # Save alerts
            with open(f"{self.output_dir}/nairobi_alerts.json", 'w') as f:
                json.dump(alerts, f, indent=2)
            
            print(f"✅ Created {len(alerts)} sample alerts")
            return alerts
            
        except Exception as e:
            print(f"❌ Error creating alerts: {e}")
            return []
    
    def generate_dashboard_stats(self, monitoring_zones, policy_recommendations, alerts):
        """Generate dashboard statistics"""
        try:
            # Calculate air quality stats
            pm25_values = [zone.get('pm25') for zone in monitoring_zones if zone.get('pm25')]
            avg_pm25 = sum(pm25_values) / len(pm25_values) if pm25_values else 0
            max_pm25 = max(pm25_values) if pm25_values else 0
            unhealthy_readings = len([pm25 for pm25 in pm25_values if pm25 > 35])
            
            # Policy stats
            policy_stats = {}
            for policy in policy_recommendations:
                status = policy.get('status', 'pending')
                policy_stats[status] = policy_stats.get(status, 0) + 1
            
            # Alert stats
            alert_stats = {}
            for alert in alerts:
                severity = alert.get('severity', 'medium')
                alert_stats[severity] = alert_stats.get(severity, 0) + 1
            
            dashboard = {
                "air_quality": {
                    "total_measurements": len(monitoring_zones),
                    "avg_pm25": round(avg_pm25, 1),
                    "max_pm25": round(max_pm25, 1),
                    "unhealthy_readings": unhealthy_readings,
                    "last_update": datetime.now().isoformat()
                },
                "policy_stats": policy_stats,
                "alert_stats": alert_stats,
                "pollution_sources": self.analyze_pollution_sources(monitoring_zones),
                "generated_at": datetime.now().isoformat()
            }
            
            # Save dashboard stats
            with open(f"{self.output_dir}/nairobi_dashboard_stats.json", 'w') as f:
                json.dump(dashboard, f, indent=2)
            
            print(f"✅ Generated dashboard statistics")
            return dashboard
            
        except Exception as e:
            print(f"❌ Error generating dashboard stats: {e}")
            return {}
    
    def analyze_pollution_sources(self, monitoring_zones):
        """Analyze pollution sources from monitoring data"""
        sources = []
        
        for zone in monitoring_zones:
            pm25 = zone.get('pm25', 0)
            name = zone.get('name', 'Unknown')
            
            # Simple source attribution based on location names and PM2.5 levels
            if 'industrial' in name.lower():
                source_type = 'industry'
            elif 'cbd' in name.lower() or 'central' in name.lower():
                source_type = 'traffic'
            elif pm25 > 60:
                source_type = 'mixed'
            else:
                source_type = 'background'
            
            sources.append({
                "source_type": source_type,
                "measurement_count": 1,
                "avg_pm25": pm25,
                "location": name
            })
        
        return sources
    
    # Helper methods
    def get_severity_level(self, pm25):
        """Get severity level from PM2.5 value"""
        if not pm25:
            return 'unknown'
        if pm25 <= 15:
            return 'good'
        elif pm25 <= 25:
            return 'moderate'
        elif pm25 <= 35:
            return 'unhealthy_sensitive'
        elif pm25 <= 55:
            return 'unhealthy'
        elif pm25 <= 150:
            return 'very_unhealthy'
        else:
            return 'hazardous'
    
    def get_health_impact(self, pm25):
        """Get health impact description"""
        if not pm25:
            return 'No Data'
        if pm25 <= 15:
            return 'Good'
        elif pm25 <= 25:
            return 'Moderate'
        elif pm25 <= 35:
            return 'Unhealthy for Sensitive Groups'
        elif pm25 <= 55:
            return 'Unhealthy'
        elif pm25 <= 150:
            return 'Very Unhealthy'
        else:
            return 'Hazardous'
    
    def calculate_aqi(self, pm25):
        """Calculate AQI from PM2.5"""
        if not pm25:
            return 0
        # Simplified AQI calculation
        if pm25 <= 15:
            return int((50 / 15) * pm25)
        elif pm25 <= 25:
            return int(50 + ((100 - 50) / (25 - 15)) * (pm25 - 15))
        elif pm25 <= 35:
            return int(100 + ((150 - 100) / (35 - 25)) * (pm25 - 25))
        elif pm25 <= 55:
            return int(150 + ((200 - 150) / (55 - 35)) * (pm25 - 35))
        else:
            return min(500, int(200 + ((500 - 200) / (500 - 55)) * (pm25 - 55)))
    
    def extract_impact_percentage(self, impact_text):
        """Extract percentage from impact text"""
        import re
        if not impact_text:
            return 20.0
        
        match = re.search(r'(\d+)(?:-\d+)?%', str(impact_text))
        if match:
            return float(match.group(1))
        return 20.0
    
    def score_to_priority(self, score):
        """Convert priority score to priority level"""
        if not score:
            return 'medium'
        if score >= 90:
            return 'critical'
        elif score >= 80:
            return 'high'
        elif score >= 60:
            return 'medium'
        else:
            return 'low'
    
    def estimate_cost(self, policy_type):
        """Estimate cost based on policy type"""
        costs = {
            'vehicle restriction': 8200,
            'emission monitoring': 15000,
            'waste management': 12000,
            'traffic control': 5000,
            'industrial monitoring': 18000
        }
        return costs.get(policy_type.lower(), 10000)
    
    def estimate_implementation_time(self, policy_type):
        """Estimate implementation time in days"""
        times = {
            'vehicle restriction': 30,
            'emission monitoring': 90,
            'waste management': 60,
            'traffic control': 21,
            'industrial monitoring': 120
        }
        return times.get(policy_type.lower(), 60)

def main():
    """Main execution function"""
    print("🌍 UNEP Nairobi Air Quality Data Import (Simplified)")
    print("=" * 55)
    
    importer = SimpleNairobiDataImporter()
    
    # Step 1: Import monitoring zones
    print("\n1️⃣ Importing monitoring zone data...")
    monitoring_zones = importer.import_monitoring_zones()
    
    # Step 2: Import intervention zones
    print("\n2️⃣ Importing intervention zones...")
    intervention_zones, policy_recommendations = importer.import_intervention_zones()
    
    # Step 3: Create sample alerts
    print("\n3️⃣ Creating sample alerts...")
    alerts = importer.create_sample_alerts(monitoring_zones)
    
    # Step 4: Generate dashboard stats
    print("\n4️⃣ Generating dashboard statistics...")
    dashboard_stats = importer.generate_dashboard_stats(monitoring_zones, policy_recommendations, alerts)
    
    # Step 5: Generate summary
    print("\n" + "="*50)
    print("📊 NAIROBI AIR QUALITY DATA SUMMARY")
    print("="*50)
    print(f"🌬️  Monitoring Zones: {len(monitoring_zones)}")
    if monitoring_zones:
        pm25_values = [zone.get('pm25') for zone in monitoring_zones if zone.get('pm25')]
        if pm25_values:
            print(f"   Average PM2.5: {sum(pm25_values)/len(pm25_values):.1f} μg/m³")
            print(f"   Max PM2.5: {max(pm25_values):.1f} μg/m³")
            print(f"   Unhealthy readings: {len([pm25 for pm25 in pm25_values if pm25 > 35])}")
    
    print(f"📋 Policy Recommendations: {len(policy_recommendations)}")
    print(f"🚨 Alerts: {len(alerts)}")
    print(f"📁 Data files created in '{importer.output_dir}/' directory")
    print("="*50)
    
    print("\n✅ Data import complete!")
    print("\nFiles created:")
    print("  - data/nairobi_monitoring_zones.json")
    print("  - data/nairobi_monitoring_zones.geojson")
    print("  - data/nairobi_intervention_zones.json")
    print("  - data/nairobi_policy_recommendations.json")
    print("  - data/nairobi_alerts.json")
    print("  - data/nairobi_dashboard_stats.json")
    
    print("\nNext steps:")
    print("- Start the backend API: cd backend && npm run dev")
    print("- Start the frontend: cd frontend && npm run dev")
    print("- Visit http://localhost:3000 to view the dashboard")

if __name__ == "__main__":
    main()