#!/usr/bin/env python3
"""
Quick diagnostic script to identify and fix the dashboard issue
"""

import requests
import json
import subprocess
import os

def check_backend_status():
    """Check if backend is running and responding"""
    try:
        response = requests.get("http://localhost:3001/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is running - Status: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"⚠️  Backend responding but status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running on port 3001")
        print("   Start with: cd backend && npm run dev")
        return False
    except Exception as e:
        print(f"❌ Backend error: {e}")
        return False

def test_api_endpoints():
    """Test specific API endpoints that the frontend needs"""
    endpoints = [
        "/api/air/nairobi-zones",
        "/api/policy/recommendations"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"http://localhost:3001{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {endpoint} - Working")
                if 'features' in data:
                    print(f"   Features: {len(data['features'])}")
                elif 'recommendations' in data:
                    print(f"   Recommendations: {len(data['recommendations'])}")
            else:
                print(f"❌ {endpoint} - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('message', 'Unknown error')}")
                except:
                    print(f"   Raw response: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def check_database():
    """Check if database has data"""
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv('backend/.env')
        
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432),
            database=os.getenv('DB_NAME', 'unep_air'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        cursor = conn.cursor()
        
        # Check air measurements
        cursor.execute("SELECT COUNT(*) FROM air_measurements")
        measurement_count = cursor.fetchone()[0]
        print(f"📊 Air measurements: {measurement_count}")
        
        if measurement_count == 0:
            print("⚠️  No data in database - Run: python import_nairobi_data.py")
        
        # Check policy recommendations
        cursor.execute("SELECT COUNT(*) FROM policy_recommendations")
        policy_count = cursor.fetchone()[0]
        print(f"📋 Policy recommendations: {policy_count}")
        
        cursor.close()
        conn.close()
        
        return measurement_count > 0
        
    except ImportError:
        print("❌ psycopg2 not installed - Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def create_simple_test_data():
    """Create simple test data if database is empty"""
    print("\n🔧 Creating test data...")
    
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        load_dotenv('backend/.env')
        
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432),
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
            INSERT INTO air_measurements (geom, pm25, source_type, recorded_at)
            VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, NOW())
            ON CONFLICT DO NOTHING
            """, (lon, lat, pm25, source_type))
        
        conn.commit()
        print("✅ Test data created")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Failed to create test data: {e}")

def main():
    print("🔍 UNEP Platform Diagnostic")
    print("=" * 40)
    
    # Check backend
    print("\n1️⃣ Checking backend...")
    backend_ok = check_backend_status()
    
    if not backend_ok:
        print("\n🚀 Quick Fix:")
        print("cd backend && npm run dev")
        return
    
    # Check database
    print("\n2️⃣ Checking database...")
    db_has_data = check_database()
    
    if not db_has_data:
        create_simple_test_data()
    
    # Test API endpoints
    print("\n3️⃣ Testing API endpoints...")
    test_api_endpoints()
    
    print("\n" + "=" * 40)
    print("🎯 Summary:")
    print("- If backend is not running: cd backend && npm run dev")
    print("- If no data: python import_nairobi_data.py")
    print("- If SQL errors: Check backend logs for parameter issues")
    print("- Frontend should be at: http://localhost:3000")

if __name__ == "__main__":
    main()