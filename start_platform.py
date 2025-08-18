#!/usr/bin/env python3
"""
UNEP Platform Startup Script
Checks setup and provides clear instructions
"""

import os
import subprocess
import requests
import time

def check_node_modules():
    """Check if node_modules are installed"""
    backend_modules = os.path.exists('backend/node_modules')
    frontend_modules = os.path.exists('frontend/node_modules')
    
    print("📦 Checking dependencies...")
    print(f"   Backend node_modules: {'✅' if backend_modules else '❌'}")
    print(f"   Frontend node_modules: {'✅' if frontend_modules else '❌'}")
    
    if not backend_modules:
        print("\n🔧 Backend dependencies missing. Run:")
        print("   cd backend && npm install")
        return False
    
    if not frontend_modules:
        print("\n🔧 Frontend dependencies missing. Run:")
        print("   cd frontend && npm install")
        return False
    
    return True

def check_env_files():
    """Check if environment files exist"""
    backend_env = os.path.exists('backend/.env')
    frontend_env = os.path.exists('frontend/.env')
    
    print("\n⚙️  Checking environment files...")
    print(f"   Backend .env: {'✅' if backend_env else '❌'}")
    print(f"   Frontend .env: {'✅' if frontend_env else '❌'}")
    
    if not backend_env:
        print("\n🔧 Creating backend .env file...")
        try:
            with open('backend/.env', 'w') as f:
                f.write("""NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unep_air
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
""")
            print("   ✅ Created backend/.env")
        except Exception as e:
            print(f"   ❌ Failed to create backend/.env: {e}")
    
    if not frontend_env:
        print("\n🔧 Creating frontend .env file...")
        try:
            with open('frontend/.env', 'w') as f:
                f.write("""VITE_API_URL=http://localhost:3001
VITE_ENABLE_AUTH=false
VITE_ENABLE_REALTIME=true
""")
            print("   ✅ Created frontend/.env")
        except Exception as e:
            print(f"   ❌ Failed to create frontend/.env: {e}")

def check_backend_running():
    """Check if backend is running"""
    try:
        response = requests.get("http://localhost:3001/health", timeout=2)
        if response.status_code == 200:
            print("✅ Backend is running on port 3001")
            return True
    except:
        pass
    
    print("❌ Backend is not running on port 3001")
    return False

def check_database():
    """Check database connection"""
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
        cursor.execute("SELECT COUNT(*) FROM air_measurements")
        count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"✅ Database connected - {count} air measurements")
        return count > 0
        
    except ImportError:
        print("⚠️  psycopg2 not installed (optional for this check)")
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def main():
    print("🌍 UNEP Air Quality Platform - Startup Check")
    print("=" * 50)
    
    # Check dependencies
    if not check_node_modules():
        return
    
    # Check environment files
    check_env_files()
    
    # Check if backend is running
    print("\n🖥️  Checking backend server...")
    backend_running = check_backend_running()
    
    # Check database
    print("\n🗄️  Checking database...")
    db_ok = check_database()
    
    print("\n" + "=" * 50)
    print("🎯 STARTUP INSTRUCTIONS")
    print("=" * 50)
    
    if not backend_running:
        print("\n1️⃣ START BACKEND (Required - this is missing!):")
        print("   Open a new terminal and run:")
        print("   cd backend")
        print("   npm run dev")
        print("   (Keep this terminal open)")
    
    print("\n2️⃣ FRONTEND is already running:")
    print("   ✅ http://localhost:3000")
    
    if not db_ok:
        print("\n3️⃣ IMPORT DATA (if no data):")
        print("   python import_nairobi_data.py")
    
    print("\n4️⃣ VERIFY SETUP:")
    print("   Backend health: http://localhost:3001/health")
    print("   API test: http://localhost:3001/api/air/nairobi-zones")
    print("   Dashboard: http://localhost:3000")
    
    print("\n🔧 TROUBLESHOOTING:")
    print("   - ECONNREFUSED = Backend not running")
    print("   - 500 errors = Database/SQL issues")
    print("   - Empty dashboard = No data imported")
    
    if not backend_running:
        print("\n⚠️  CRITICAL: You must start the backend server!")
        print("   The frontend cannot work without the backend API.")

if __name__ == "__main__":
    main()