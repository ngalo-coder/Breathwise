#!/usr/bin/env python3
"""
Port Configuration Checker for UNEP Platform
Verifies all port configurations are aligned
"""

import os
import re

def check_backend_ports():
    """Check backend port configuration"""
    print("🖥️  Backend Port Configuration:")
    
    # Check .env file
    env_port = None
    if os.path.exists('backend/.env'):
        with open('backend/.env', 'r') as f:
            content = f.read()
            match = re.search(r'PORT=(\d+)', content)
            if match:
                env_port = match.group(1)
                print(f"   backend/.env: PORT={env_port}")
            else:
                print("   backend/.env: PORT not found")
    else:
        print("   backend/.env: File not found")
    
    # Check app.js default
    app_default = None
    if os.path.exists('backend/src/app.js'):
        with open('backend/src/app.js', 'r') as f:
            content = f.read()
            match = re.search(r'process\.env\.PORT \|\| (\d+)', content)
            if match:
                app_default = match.group(1)
                print(f"   backend/src/app.js: Default port {app_default}")
    
    backend_port = env_port or app_default or "unknown"
    print(f"   → Backend will run on: {backend_port}")
    return backend_port

def check_frontend_ports():
    """Check frontend port configuration"""
    print("\n🌐 Frontend Port Configuration:")
    
    # Check .env file
    api_url = None
    if os.path.exists('frontend/.env'):
        with open('frontend/.env', 'r') as f:
            content = f.read()
            match = re.search(r'VITE_API_URL=http://localhost:(\d+)', content)
            if match:
                api_url = match.group(1)
                print(f"   frontend/.env: VITE_API_URL points to port {api_url}")
    
    # Check vite.config.ts
    proxy_port = None
    if os.path.exists('frontend/vite.config.ts'):
        with open('frontend/vite.config.ts', 'r') as f:
            content = f.read()
            match = re.search(r'target: [\'"]http://localhost:(\d+)[\'"]', content)
            if match:
                proxy_port = match.group(1)
                print(f"   frontend/vite.config.ts: Proxy target port {proxy_port}")
            
            # Check frontend port
            frontend_match = re.search(r'port: (\d+)', content)
            if frontend_match:
                frontend_port = frontend_match.group(1)
                print(f"   frontend/vite.config.ts: Frontend port {frontend_port}")
    
    return api_url, proxy_port

def check_port_alignment():
    """Check if all ports are properly aligned"""
    print("\n🔍 Port Alignment Check:")
    
    backend_port = check_backend_ports()
    api_url_port, proxy_port = check_frontend_ports()
    
    print(f"\n📊 Summary:")
    print(f"   Backend runs on: {backend_port}")
    print(f"   Frontend API URL: {api_url_port}")
    print(f"   Frontend proxy: {proxy_port}")
    
    # Check alignment
    issues = []
    
    if api_url_port and api_url_port != backend_port:
        issues.append(f"❌ API URL port ({api_url_port}) doesn't match backend port ({backend_port})")
    
    if proxy_port and proxy_port != backend_port:
        issues.append(f"❌ Proxy port ({proxy_port}) doesn't match backend port ({backend_port})")
    
    if not issues:
        print("✅ All ports are aligned!")
        return True
    else:
        print("\n🚨 Port Misalignment Issues:")
        for issue in issues:
            print(f"   {issue}")
        return False

def provide_startup_instructions(backend_port):
    """Provide correct startup instructions"""
    print(f"\n🚀 Correct Startup Instructions:")
    print(f"   1. Backend: cd backend && npm run dev")
    print(f"      → Will run on http://localhost:{backend_port}")
    print(f"   2. Frontend: cd frontend && npm run dev")
    print(f"      → Will run on http://localhost:3000")
    print(f"   3. Test backend: http://localhost:{backend_port}/health")
    print(f"   4. Test API: http://localhost:{backend_port}/api/air/nairobi-zones")
    print(f"   5. View dashboard: http://localhost:3000")

def main():
    print("🔍 UNEP Platform Port Configuration Check")
    print("=" * 50)
    
    backend_port = check_backend_ports()
    check_frontend_ports()
    
    is_aligned = check_port_alignment()
    
    if is_aligned:
        print(f"\n🎯 Everything is configured correctly!")
        provide_startup_instructions(backend_port)
    else:
        print(f"\n🔧 Port configuration has been fixed!")
        print(f"   → Restart your frontend: Ctrl+C then npm run dev")
        provide_startup_instructions(backend_port)
    
    print(f"\n💡 Remember:")
    print(f"   - Backend must be running on port {backend_port}")
    print(f"   - Frontend proxy will forward /api requests to backend")
    print(f"   - ECONNREFUSED means backend is not running")

if __name__ == "__main__":
    main()