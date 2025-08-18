#!/usr/bin/env python3
"""
Backend Error Debugger
Tests the specific API endpoint that's failing and provides detailed error info
"""

import requests
import json
import psycopg2
import os
from dotenv import load_dotenv

def test_backend_health():
    """Test if backend is responding"""
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        print(f"✅ Backend health: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   Timestamp: {data.get('timestamp')}")
        return True
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_nairobi_zones_endpoint():
    """Test the specific failing endpoint"""
    try:
        print("\n🧪 Testing /api/air/nairobi-zones endpoint...")
        response = requests.get("http://localhost:8001/api/air/nairobi-zones", timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {len(data.get('features', []))} features returned")
            return True
        else:
            print(f"   ❌ Error Response:")
            try:
                error_data = response.json()
                print(f"      Error: {error_data.get('error', 'Unknown error')}")
                print(f"      Message: {error_data.get('message', 'No message')}")
            except:
                print(f"      Raw response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_database_connection():
    """Test database connection and data"""
    try:
        load_dotenv('backend/.env')
        
        print("\n🗄️  Testing database connection...")
        
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 5432)),
            database=os.getenv('DB_NAME', 'unep_air'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"   ✅ PostgreSQL connected: {version[:50]}...")
        
        # Test PostGIS
        cursor.execute("SELECT PostGIS_Version();")
        postgis_version = cursor.fetchone()[0]
        print(f"   ✅ PostGIS available: {postgis_version}")
        
        # Check if tables exist
        cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'air_measurements'
        """)
        
        if cursor.fetchone():
            print("   ✅ air_measurements table exists")
            
            # Check data count
            cursor.execute("SELECT COUNT(*) FROM air_measurements")
            total_count = cursor.fetchone()[0]
            print(f"   📊 Total measurements: {total_count}")
            
            # Check monitoring stations specifically
            cursor.execute("SELECT COUNT(*) FROM air_measurements WHERE source_type = 'monitoring_station'")
            station_count = cursor.fetchone()[0]
            print(f"   📍 Monitoring stations: {station_count}")
            
            if station_count == 0:
                print("   ⚠️  No monitoring station data found!")
                print("   💡 Run: python import_nairobi_data.py")
            
            # Test the actual query that the API uses
            print("\n   🔍 Testing API query...")
            cursor.execute("""
            SELECT 
                ST_AsGeoJSON(geom)::json AS geometry,
                pm25,
                source_type,
                recorded_at,
                quality_flag
            FROM air_measurements 
            WHERE source_type = 'monitoring_station'
              AND geom && ST_MakeEnvelope(36.70, -1.40, 37.12, -1.15, 4326)
            ORDER BY recorded_at DESC
            LIMIT 5
            """)
            
            results = cursor.fetchall()
            print(f"   📋 Query returned {len(results)} rows")
            
            if results:
                for i, row in enumerate(results):
                    print(f"      Row {i+1}: PM2.5={row[1]}, Source={row[2]}")
            
        else:
            print("   ❌ air_measurements table does not exist!")
            print("   💡 Run: psql -d unep_air -f database/init.sql")
        
        cursor.close()
        conn.close()
        return True
        
    except ImportError:
        print("   ❌ psycopg2 not installed: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"   ❌ Database error: {e}")
        return False

def check_backend_logs():
    """Provide instructions for checking backend logs"""
    print("\n📋 Backend Log Instructions:")
    print("   1. Look at your backend terminal window")
    print("   2. Check for error messages when the API is called")
    print("   3. Common errors:")
    print("      - 'relation \"air_measurements\" does not exist' → Run database init")
    print("      - 'column \"geom\" does not exist' → PostGIS not set up")
    print("      - 'connection refused' → Database not running")
    print("      - 'syntax error' → SQL parameter issues")

def provide_solutions():
    """Provide step-by-step solutions"""
    print("\n🔧 SOLUTIONS:")
    print("\n1️⃣ If database table doesn't exist:")
    print("   createdb unep_air")
    print("   psql -d unep_air -f database/init.sql")
    
    print("\n2️⃣ If no monitoring station data:")
    print("   python import_nairobi_data.py")
    
    print("\n3️⃣ If SQL syntax errors:")
    print("   python quick_fix.py")
    
    print("\n4️⃣ Create test data manually:")
    print("   python create_test_data.py")

def create_test_data_script():
    """Create a script to insert test data"""
    script_content = '''#!/usr/bin/env python3
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('backend/.env')

try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        database=os.getenv('DB_NAME', 'unep_air'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )
    
    cursor = conn.cursor()
    
    # Insert test monitoring stations
    test_data = [
        (36.8172, -1.2864, 45.2, 'monitoring_station'),  # CBD
        (36.8581, -1.3128, 67.3, 'monitoring_station'),  # Industrial
        (36.8089, -1.2630, 32.1, 'monitoring_station'),  # Westlands
        (36.8833, -1.3167, 89.5, 'monitoring_station'),  # Embakasi
        (36.7083, -1.3197, 18.7, 'monitoring_station'),  # Karen
    ]
    
    for lon, lat, pm25, source_type in test_data:
        cursor.execute("""
        INSERT INTO air_measurements (geom, pm25, source_type, recorded_at, quality_flag)
        VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, NOW(), 1)
        ON CONFLICT DO NOTHING
        """, (lon, lat, pm25, source_type))
    
    conn.commit()
    print("✅ Test data inserted successfully")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
'''
    
    with open('create_test_data.py', 'w') as f:
        f.write(script_content)
    
    print("📝 Created create_test_data.py")

def main():
    print("🔍 Backend 500 Error Debugger")
    print("=" * 40)
    
    # Test backend health
    if not test_backend_health():
        print("❌ Backend is not responding - start it first!")
        return
    
    # Test the failing endpoint
    api_working = test_nairobi_zones_endpoint()
    
    # Test database
    db_working = test_database_connection()
    
    # Check logs
    check_backend_logs()
    
    # Provide solutions
    if not api_working or not db_working:
        provide_solutions()
        create_test_data_script()
    
    print(f"\n🎯 Next Steps:")
    if not db_working:
        print("   1. Fix database issues first")
        print("   2. Run: python create_test_data.py")
    else:
        print("   1. Check backend terminal for specific error messages")
        print("   2. Try: python quick_fix.py")
    
    print("   3. Refresh your browser after fixes")

if __name__ == "__main__":
    main()
'''