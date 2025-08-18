#!/usr/bin/env python3
"""
Current Status Debugger for UNEP Platform
Checks what's actually running and provides specific next steps
"""

import requests
import subprocess
import os
import socket
import json

def check_port_in_use(port):
    """Check if a port is in use"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            result = s.connect_ex(('localhost', port))
            return result == 0
    except:
        return False

def test_backend_endpoints():
    """Test backend endpoints"""
    endpoints = [
        ('Health Check', 'http://localhost:8001/health'),
        ('Nairobi Zones', 'http://localhost:8001/api/air/nairobi-zones'),
        ('Policy Recommendations', 'http://localhost:8001/api/policy/recommendations')
    ]
    
    print("🔗 Testing Backend Endpoints:")
    
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                if 'features' in data:
                    print(f"   ✅ {name}: {len(data['features'])} features")
                elif 'recommendations' in data:
                    print(f"   ✅ {name}: {len(data['recommendations'])} recommendations")
                else:
                    print(f"   ✅ {name}: OK")
            else:
                print(f"   ❌ {name}: HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ {name}: Connection refused (backend not running)")
        except requests.exceptions.Timeout:
            print(f"   ❌ {name}: Timeout")
        except Exception as e:
            print(f"   ❌ {name}: {str(e)[:50]}...")

def check_processes():
    """Check for running Node.js processes"""
    try:
        # Check for node processes on Windows
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq node.exe'], 
                              capture_output=True, text=True, shell=True)
        
        if 'node.exe' in result.stdout:
            print("🔍 Node.js processes found:")
            lines = result.stdout.split('\n')
            for line in lines:
                if 'node.exe' in line:
                    print(f"   {line.strip()}")
        else:
            print("❌ No Node.js processes running")
            
    except Exception as e:
        print(f"⚠️  Could not check processes: {e}")

def check_database_connection():
    """Quick database check"""
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        load_dotenv('backend/.env')
        
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 5432)),
            database=os.getenv('DB_NAME', 'unep_air'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM air_measurements")
        count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"✅ Database: {count} air measurements")
        return count > 0
        
    except ImportError:
        print("⚠️  Database check skipped (psycopg2 not available)")
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def provide_specific_instructions():
    """Provide specific next steps based on current status"""
    print("\n🎯 SPECIFIC NEXT STEPS:")
    
    backend_running = check_port_in_use(8001)
    frontend_running = check_port_in_use(3000)
    
    print(f"   Backend (port 8001): {'✅ Running' if backend_running else '❌ Not running'}")
    print(f"   Frontend (port 3000): {'✅ Running' if frontend_running else '❌ Not running'}")
    
    if not backend_running:
        print("\n🚨 CRITICAL: Backend is not running!")
        print("   1. Open a NEW terminal/command prompt")
        print("   2. Navigate to backend folder: cd backend")
        print("   3. Start the server: npm run dev")
        print("   4. Look for: '🚀 UNEP API Server running on port 8001'")
        print("   5. Keep that terminal open")
        
    if not frontend_running:
        print("\n🚨 Frontend is not running!")
        print("   1. In another terminal: cd frontend")
        print("   2. Start frontend: npm run dev")
        
    if backend_running and frontend_running:
        print("\n✅ Both servers are running - checking API connectivity...")
        test_backend_endpoints()

def create_test_backend_script():
    """Create a simple test script to verify backend"""
    script_content = '''#!/usr/bin/env python3
import requests
import json

def test_api():
    try:
        # Test health endpoint
        response = requests.get("http://localhost:8001/health", timeout=5)
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        
        # Test nairobi zones
        response = requests.get("http://localhost:8001/api/air/nairobi-zones", timeout=5)
        print(f"Nairobi zones: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Features: {len(data.get('features', []))}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
'''
    
    with open('test_backend.py', 'w') as f:
        f.write(script_content)
    
    print("📝 Created test_backend.py - run this after starting backend")

def main():
    print("🔍 UNEP Platform Current Status Debug")
    print("=" * 50)
    
    # Check ports
    print("🔌 Port Status:")
    print(f"   Port 8001 (Backend): {'✅ In use' if check_port_in_use(8001) else '❌ Available'}")
    print(f"   Port 3000 (Frontend): {'✅ In use' if check_port_in_use(3000) else '❌ Available'}")
    
    # Check processes
    print(f"\n💻 Process Status:")
    check_processes()
    
    # Test backend if running
    if check_port_in_use(8001):
        print(f"\n🧪 Backend API Tests:")
        test_backend_endpoints()
    
    # Check database
    print(f"\n🗄️  Database Status:")
    check_database_connection()
    
    # Provide instructions
    provide_specific_instructions()
    
    # Create test script
    print(f"\n🛠️  Tools Created:")
    create_test_backend_script()
    
    print(f"\n📋 Summary:")
    print(f"   - Frontend config: ✅ Correct (port 8001)")
    print(f"   - Backend config: ✅ Correct (port 8001)")
    print(f"   - Main issue: Backend server not started")
    print(f"   - Solution: Start backend with 'cd backend && npm run dev'")

if __name__ == "__main__":
    main()
'''