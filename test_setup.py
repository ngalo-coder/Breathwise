#!/usr/bin/env python3
"""
Quick test script to verify UNEP platform setup
Tests database connection and API endpoints
"""

import requests
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

def test_database_connection():
    """Test PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432),
            database=os.getenv('DB_NAME', 'unep_air'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        cursor = conn.cursor()
        
        # Test PostGIS extension
        cursor.execute("SELECT PostGIS_Version();")
        postgis_version = cursor.fetchone()[0]
        print(f"✅ Database connected - PostGIS version: {postgis_version}")
        
        # Check if tables exist
        cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('air_measurements', 'policy_grid', 'policy_recommendations', 'alert_history')
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"✅ Tables found: {', '.join(tables)}")
        
        # Check data count
        cursor.execute("SELECT COUNT(*) FROM air_measurements")
        measurement_count = cursor.fetchone()[0]
        print(f"📊 Air measurements in database: {measurement_count}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    base_url = "http://localhost:3001"
    
    endpoints = [
        "/health",
        "/api/air/hotspots?bbox=36.70,-1.40,37.12,-1.15",
        "/api/air/nairobi-zones",
        "/api/policy/recommendations",
        "/api/policy/dashboard"
    ]
    
    print("\n🔗 Testing API endpoints...")
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if endpoint == "/health":
                    print(f"✅ {endpoint} - Status: {data.get('status', 'unknown')}")
                elif 'features' in data:
                    print(f"✅ {endpoint} - Features: {len(data['features'])}")
                elif 'recommendations' in data:
                    print(f"✅ {endpoint} - Recommendations: {len(data['recommendations'])}")
                else:
                    print(f"✅ {endpoint} - Response received")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ {endpoint} - Backend not running")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def test_frontend():
    """Test frontend availability"""
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend accessible at http://localhost:3000")
        else:
            print(f"⚠️  Frontend status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Frontend not running - Start with: cd frontend && npm run dev")
    except Exception as e:
        print(f"❌ Frontend error: {e}")

def main():
    print("🌍 UNEP Air Quality Platform - Setup Test")
    print("=" * 50)
    
    # Test 1: Database
    print("\n1️⃣ Testing database connection...")
    db_ok = test_database_connection()
    
    # Test 2: API endpoints
    print("\n2️⃣ Testing API endpoints...")
    test_api_endpoints()
    
    # Test 3: Frontend
    print("\n3️⃣ Testing frontend...")
    test_frontend()
    
    print("\n" + "=" * 50)
    print("🎯 Setup Status Summary:")
    
    if db_ok:
        print("✅ Database: Ready")
    else:
        print("❌ Database: Not ready - Run: python import_nairobi_data.py")
    
    print("\n📋 Next Steps:")
    print("1. If database is empty, run: python import_nairobi_data.py")
    print("2. Start backend: cd backend && npm run dev")
    print("3. Start frontend: cd frontend && npm run dev")
    print("4. Open dashboard: http://localhost:3000")
    
    print("\n🔧 Troubleshooting:")
    print("- Database issues: Check PostgreSQL is running")
    print("- API issues: Verify backend/.env database credentials")
    print("- Frontend issues: Check npm install completed successfully")

if __name__ == "__main__":
    main()