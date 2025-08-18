#!/usr/bin/env python3
"""
Test Enhanced Dashboard
Checks if all components are working correctly
"""

import requests
import time

def test_backend_endpoints():
    """Test that backend is serving data correctly"""
    print("🧪 Testing Backend Endpoints...")
    
    endpoints = [
        ("Health Check", "http://localhost:8001/health"),
        ("Nairobi Zones", "http://localhost:8001/api/air/nairobi-zones"),
        ("Policy Recommendations", "http://localhost:8001/api/policy/recommendations")
    ]
    
    all_working = True
    
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
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
                all_working = False
        except Exception as e:
            print(f"   ❌ {name}: {str(e)[:50]}...")
            all_working = False
    
    return all_working

def test_frontend():
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend accessible at http://localhost:3000")
            return True
        else:
            print(f"   ❌ Frontend status: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Frontend error: {e}")
        return False

def main():
    print("🔍 Enhanced Dashboard Test")
    print("=" * 40)
    
    # Test backend
    backend_ok = test_backend_endpoints()
    
    # Test frontend
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 40)
    print("📊 Test Results:")
    print(f"   Backend: {'✅ Working' if backend_ok else '❌ Issues'}")
    print(f"   Frontend: {'✅ Working' if frontend_ok else '❌ Issues'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 SUCCESS! Your enhanced dashboard should be working!")
        print("\n🎯 New Features Available:")
        print("   - Interactive ArcGIS map with Nairobi zones")
        print("   - Charts and data visualization")
        print("   - Tabbed interface (Map, Charts, Details, Policies)")
        print("   - Data export functionality")
        print("   - Auto-refresh every 5 minutes")
        print("   - Enhanced mobile design")
        
        print("\n🗺️ To enable full ArcGIS features:")
        print("   1. Get free API key: https://developers.arcgis.com")
        print("   2. Add to frontend/.env: VITE_ARCGIS_API_KEY=your_key")
        print("   3. Restart frontend: npm run dev")
        
        print("\n🌟 Visit: http://localhost:3000")
    else:
        print("\n🔧 Issues to fix:")
        if not backend_ok:
            print("   - Start backend: cd backend && npm run dev")
        if not frontend_ok:
            print("   - Start frontend: cd frontend && npm run dev")

if __name__ == "__main__":
    main()