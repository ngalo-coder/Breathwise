#!/usr/bin/env python3
"""
Database Setup Options for UNEP Platform
Provides multiple options for setting up the database
"""

import os
import subprocess
import json

def check_postgresql_installed():
    """Check if PostgreSQL is installed"""
    try:
        # Try to find psql command
        result = subprocess.run(['where', 'psql'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print("✅ PostgreSQL is installed")
            return True
        else:
            print("❌ PostgreSQL is not installed")
            return False
    except:
        print("❌ PostgreSQL is not installed")
        return False

def provide_postgresql_installation():
    """Provide PostgreSQL installation instructions"""
    print("\n🔧 PostgreSQL Installation Options:")
    print("\n1️⃣ Download from Official Site:")
    print("   - Visit: https://www.postgresql.org/download/windows/")
    print("   - Download PostgreSQL 15 or 16")
    print("   - Run installer and follow setup wizard")
    print("   - Remember the password you set for 'postgres' user")
    
    print("\n2️⃣ Using Chocolatey (if installed):")
    print("   choco install postgresql")
    
    print("\n3️⃣ Using Winget:")
    print("   winget install PostgreSQL.PostgreSQL")

def create_sqlite_alternative():
    """Create SQLite-based alternative for development"""
    print("\n🔄 Creating SQLite Alternative...")
    
    sqlite_import_script = '''#!/usr/bin/env python3
"""
SQLite-based Nairobi Data Import (Alternative to PostgreSQL)
"""

import sqlite3
import pandas as pd
import json
from datetime import datetime

class SQLiteNairobiImporter:
    def __init__(self):
        self.db_path = 'unep_air.db'
        
    def create_tables(self):
        """Create SQLite tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create air_measurements table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS air_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            longitude REAL,
            latitude REAL,
            pm25 REAL,
            pm10 REAL,
            no2 REAL,
            so2 REAL,
            source_type TEXT,
            recorded_at TEXT,
            quality_flag INTEGER DEFAULT 1
        )
        """)
        
        # Create policy_recommendations table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS policy_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_name TEXT,
            policy_type TEXT,
            title TEXT,
            description TEXT,
            priority TEXT,
            expected_impact_percent REAL,
            cost_estimate REAL,
            status TEXT DEFAULT 'pending',
            created_at TEXT
        )
        """)
        
        # Create alert_history table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT,
            longitude REAL,
            latitude REAL,
            severity TEXT,
            message TEXT,
            pm25_level REAL,
            triggered_at TEXT,
            status TEXT DEFAULT 'active'
        )
        """)
        
        conn.commit()
        conn.close()
        print("✅ SQLite tables created")
    
    def import_monitoring_zones(self):
        """Import monitoring zones from CSV"""
        try:
            df = pd.read_csv('air_quality_monitoring_zones_one.csv')
            print(f"Loading {len(df)} monitoring locations...")
            
            conn = sqlite3.connect(self.db_path)
            
            for _, row in df.iterrows():
                conn.execute("""
                INSERT INTO air_measurements 
                (longitude, latitude, pm25, source_type, recorded_at, quality_flag)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    row['Longitude'],
                    row['Latitude'],
                    row.get('PM25_ugm3'),
                    'monitoring_station',
                    row.get('Last_Updated', datetime.now().isoformat()),
                    self.aqi_to_quality_flag(row.get('AQI_Category', 'Unknown'))
                ))
            
            conn.commit()
            conn.close()
            print(f"✅ Imported {len(df)} monitoring zones")
            
        except Exception as e:
            print(f"❌ Error importing monitoring zones: {e}")
    
    def import_intervention_zones(self):
        """Import intervention zones from CSV"""
        try:
            df = pd.read_csv('air_quality_intervention_zone.csv')
            print(f"Loading {len(df)} intervention zones...")
            
            conn = sqlite3.connect(self.db_path)
            
            for _, row in df.iterrows():
                # Extract impact percentage
                impact_text = row.get('Expected_Impact', '20%')
                impact_percent = self.extract_impact_percentage(impact_text)
                
                conn.execute("""
                INSERT INTO policy_recommendations 
                (zone_name, policy_type, title, description, priority, expected_impact_percent, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row.get('Zone_Name'),
                    row.get('Policy_Type', 'general').lower().replace(' ', '_'),
                    row.get('Zone_Name'),
                    f"Policy intervention for {row.get('Zone_Name')} - {row.get('Expected_Impact', 'Impact TBD')}",
                    self.score_to_priority(row.get('Priority_Score', 50)),
                    impact_percent,
                    row.get('Status', 'pending').lower(),
                    datetime.now().isoformat()
                ))
            
            conn.commit()
            conn.close()
            print(f"✅ Imported {len(df)} intervention zones")
            
        except Exception as e:
            print(f"❌ Error importing intervention zones: {e}")
    
    def create_sample_alerts(self):
        """Create sample alerts"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            sample_alerts = [
                (36.8581, -1.3128, 67.3, 'High PM2.5 levels in Industrial Area', 'high'),
                (36.8833, -1.3167, 89.5, 'Very unhealthy air quality in Embakasi', 'critical'),
                (36.8172, -1.2864, 45.2, 'Moderate pollution in CBD', 'medium')
            ]
            
            for lon, lat, pm25, message, severity in sample_alerts:
                conn.execute("""
                INSERT INTO alert_history 
                (alert_type, longitude, latitude, severity, message, pm25_level, triggered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, ('pollution_spike', lon, lat, severity, message, pm25, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            print(f"✅ Created {len(sample_alerts)} sample alerts")
            
        except Exception as e:
            print(f"❌ Error creating alerts: {e}")
    
    def generate_summary(self):
        """Generate summary report"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Count measurements
            cursor.execute("SELECT COUNT(*) FROM air_measurements")
            measurement_count = cursor.fetchone()[0]
            
            # Count policies
            cursor.execute("SELECT COUNT(*) FROM policy_recommendations")
            policy_count = cursor.fetchone()[0]
            
            # Count alerts
            cursor.execute("SELECT COUNT(*) FROM alert_history")
            alert_count = cursor.fetchone()[0]
            
            print("\\n" + "="*50)
            print("📊 NAIROBI AIR QUALITY DATA SUMMARY (SQLite)")
            print("="*50)
            print(f"🌬️  Air Quality Measurements: {measurement_count}")
            print(f"📋 Policy Recommendations: {policy_count}")
            print(f"🚨 Alerts: {alert_count}")
            print("="*50)
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error generating summary: {e}")
    
    # Helper methods
    def aqi_to_quality_flag(self, aqi_category):
        mapping = {
            'Good': 1, 'Moderate': 1, 'Unhealthy for Sensitive Groups': 2,
            'Unhealthy': 2, 'Very Unhealthy': 3, 'Hazardous': 3
        }
        return mapping.get(aqi_category, 2)
    
    def extract_impact_percentage(self, impact_text):
        import re
        if not impact_text:
            return 20.0
        match = re.search(r'(\\d+)(?:-\\d+)?%', str(impact_text))
        return float(match.group(1)) if match else 20.0
    
    def score_to_priority(self, score):
        if score >= 90: return 'critical'
        elif score >= 80: return 'high'
        elif score >= 60: return 'medium'
        else: return 'low'

def main():
    print("🌍 UNEP Nairobi Data Import (SQLite Version)")
    print("=" * 45)
    
    importer = SQLiteNairobiImporter()
    
    print("1️⃣ Creating database tables...")
    importer.create_tables()
    
    print("\\n2️⃣ Importing monitoring zones...")
    importer.import_monitoring_zones()
    
    print("\\n3️⃣ Importing intervention zones...")
    importer.import_intervention_zones()
    
    print("\\n4️⃣ Creating sample alerts...")
    importer.create_sample_alerts()
    
    print("\\n5️⃣ Generating summary...")
    importer.generate_summary()
    
    print("\\n✅ SQLite import complete!")
    print("\\nDatabase file created: unep_air.db")
    print("\\nNext: Update backend to use SQLite instead of PostgreSQL")

if __name__ == "__main__":
    main()
'''
    
    with open('import_nairobi_sqlite.py', 'w') as f:
        f.write(sqlite_import_script)
    
    print("📝 Created import_nairobi_sqlite.py")

def create_mock_data_solution():
    """Create a simple mock data solution for immediate testing"""
    print("\n🎯 Creating Mock Data Solution...")
    
    mock_script = '''#!/usr/bin/env python3
"""
Create Mock API Data for UNEP Platform
Creates JSON files that the backend can serve directly
"""

import json
from datetime import datetime

def create_mock_nairobi_zones():
    """Create mock Nairobi monitoring zones data"""
    zones_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.8172, -1.2864]},
                "properties": {
                    "id": "nairobi_zone_1",
                    "pm25": 45.2,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 2,
                    "aqi_category": "Unhealthy for Sensitive Groups",
                    "severity": "unhealthy_sensitive",
                    "aqi": 112
                }
            },
            {
                "type": "Feature", 
                "geometry": {"type": "Point", "coordinates": [36.8581, -1.3128]},
                "properties": {
                    "id": "nairobi_zone_2",
                    "pm25": 67.3,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 2,
                    "aqi_category": "Unhealthy",
                    "severity": "unhealthy",
                    "aqi": 158
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.8089, -1.2630]},
                "properties": {
                    "id": "nairobi_zone_3",
                    "pm25": 32.1,
                    "source_type": "monitoring_station", 
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 1,
                    "aqi_category": "Moderate",
                    "severity": "moderate",
                    "aqi": 94
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.8833, -1.3167]},
                "properties": {
                    "id": "nairobi_zone_4",
                    "pm25": 89.5,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 3,
                    "aqi_category": "Very Unhealthy",
                    "severity": "very_unhealthy",
                    "aqi": 185
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [36.7083, -1.3197]},
                "properties": {
                    "id": "nairobi_zone_5",
                    "pm25": 18.7,
                    "source_type": "monitoring_station",
                    "recorded_at": datetime.now().isoformat(),
                    "quality_flag": 1,
                    "aqi_category": "Good",
                    "severity": "good",
                    "aqi": 62
                }
            }
        ],
        "metadata": {
            "total_zones": 5,
            "city": "Nairobi",
            "country": "Kenya",
            "generated_at": datetime.now().isoformat()
        }
    }
    
    with open('mock_nairobi_zones.json', 'w') as f:
        json.dump(zones_data, f, indent=2)
    
    print("✅ Created mock_nairobi_zones.json")

def create_mock_policy_recommendations():
    """Create mock policy recommendations"""
    policies_data = {
        "recommendations": [
            {
                "id": 1,
                "title": "Peak-Hour Vehicle Restrictions (CBD)",
                "description": "Implement odd-even license plate restrictions during peak hours",
                "priority": "high",
                "expected_impact_percent": 28.5,
                "cost_estimate": 8200.00,
                "status": "pending"
            },
            {
                "id": 2,
                "title": "Industrial Stack Monitoring (Embakasi)",
                "description": "Install continuous monitoring on top 5 industrial emitters",
                "priority": "medium",
                "expected_impact_percent": 18.2,
                "cost_estimate": 15000.00,
                "status": "approved"
            },
            {
                "id": 3,
                "title": "Waste Management Enhancement (Dandora)",
                "description": "Increase waste collection frequency and anti-burning enforcement",
                "priority": "high",
                "expected_impact_percent": 42.0,
                "cost_estimate": 7500.00,
                "status": "in_progress"
            }
        ],
        "metadata": {
            "total": 3,
            "generated_at": datetime.now().isoformat()
        }
    }
    
    with open('mock_policy_recommendations.json', 'w') as f:
        json.dump(policies_data, f, indent=2)
    
    print("✅ Created mock_policy_recommendations.json")

def main():
    print("🎯 Creating Mock Data for Immediate Testing")
    print("=" * 45)
    
    create_mock_nairobi_zones()
    create_mock_policy_recommendations()
    
    print("\\n✅ Mock data files created!")
    print("\\nNext steps:")
    print("1. Update backend to serve these JSON files")
    print("2. Test the dashboard with mock data")
    print("3. Install PostgreSQL later for full functionality")

if __name__ == "__main__":
    main()
'''
    
    with open('create_mock_data.py', 'w') as f:
        f.write(mock_script)
    
    print("📝 Created create_mock_data.py")

def main():
    print("🔍 Database Setup Options for UNEP Platform")
    print("=" * 50)
    
    # Check PostgreSQL
    postgres_installed = check_postgresql_installed()
    
    if not postgres_installed:
        provide_postgresql_installation()
        create_sqlite_alternative()
        create_mock_data_solution()
        
        print("\n🎯 RECOMMENDED IMMEDIATE SOLUTION:")
        print("   1. Run: python create_mock_data.py")
        print("   2. This creates JSON files with your Nairobi data")
        print("   3. Update backend to serve these files")
        print("   4. Test dashboard immediately")
        print("   5. Install PostgreSQL later for full functionality")
        
        print("\n🔄 ALTERNATIVE SOLUTIONS:")
        print("   A. Install PostgreSQL (recommended for production)")
        print("   B. Use SQLite version: python import_nairobi_sqlite.py")
        print("   C. Use mock data: python create_mock_data.py")
    
    else:
        print("✅ PostgreSQL is available - you can use the original import script")

if __name__ == "__main__":
    main()