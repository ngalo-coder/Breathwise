#!/usr/bin/env python3
"""
Quick fix for the UNEP platform dashboard issue
Replaces the problematic air controller with a working version
"""

import shutil
import os

def fix_air_controller():
    """Replace the air controller with the working version"""
    try:
        # Backup the current controller
        shutil.copy(
            'backend/src/controllers/air.controller.js',
            'backend/src/controllers/air.controller.js.backup'
        )
        print("✅ Backed up current air controller")
        
        # Replace with the simple version
        shutil.copy(
            'backend/src/controllers/air.controller.simple.js',
            'backend/src/controllers/air.controller.js'
        )
        print("✅ Replaced air controller with working version")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to fix air controller: {e}")
        return False

def check_files_exist():
    """Check if required files exist"""
    required_files = [
        'backend/src/controllers/air.controller.js',
        'backend/src/controllers/air.controller.simple.js',
        'backend/src/config/database.js',
        'backend/src/app.js'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing files: {', '.join(missing_files)}")
        return False
    
    print("✅ All required files exist")
    return True

def main():
    print("🔧 UNEP Platform Quick Fix")
    print("=" * 30)
    
    # Check files
    if not check_files_exist():
        print("Please ensure you're in the project root directory")
        return
    
    # Fix the controller
    if fix_air_controller():
        print("\n🎯 Fix Applied Successfully!")
        print("\nNext steps:")
        print("1. Restart the backend: cd backend && npm run dev")
        print("2. Check the dashboard: http://localhost:3000")
        print("3. If still no data, run: python import_nairobi_data.py")
    else:
        print("\n❌ Fix failed. Manual intervention required.")

if __name__ == "__main__":
    main()