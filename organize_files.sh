#!/bin/bash
# UNEP Platform File Organization Script
# Run this script from your project root directory

echo "🗂️  Organizing UNEP Platform Files..."
echo "=================================================="

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p backend/data
mkdir -p backend/scripts
mkdir -p backend/database
mkdir -p archive/development-scripts

# Move data files to backend/data/
echo "📊 Moving data files..."
if [ -f "mock_nairobi_zones.json" ]; then
    mv mock_nairobi_zones.json backend/data/
    echo "   ✅ Moved mock_nairobi_zones.json"
fi

if [ -f "mock_policy_recommendations.json" ]; then
    mv mock_policy_recommendations.json backend/data/
    echo "   ✅ Moved mock_policy_recommendations.json"
fi

# Move data directory contents if it exists
if [ -d "data" ]; then
    cp -r data/* backend/data/ 2>/dev/null || true
    echo "   ✅ Copied data/ contents to backend/data/"
fi

# Move Python scripts to backend/scripts/
echo "🐍 Moving Python scripts..."

# Essential scripts (keep in backend/scripts)
essential_scripts=(
    "import_nairobi_data.py"
    "import_nairobi_data_simple.py" 
    "openaq_import.py"
    "create_mock_data.py"
)

for script in "${essential_scripts[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" backend/scripts/
        echo "   ✅ Moved $script"
    fi
done

# Development/debug scripts (archive)
debug_scripts=(
    "debug_*.py"
    "test_*.py"
    "check_*.py"
    "diagnose_*.py"
    "quick_*.py"
    "start_*.py"
    "setup_*.py"
)

for pattern in "${debug_scripts[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            mv "$file" archive/development-scripts/
            echo "   📦 Archived $file"
        fi
    done
done

# Move any remaining .py files to scripts
for file in *.py; do
    if [ -f "$file" ]; then
        mv "$file" backend/scripts/
        echo "   ✅ Moved $file to backend/scripts/"
    fi
done

# Move database files
echo "🗄️  Moving database files..."
if [ -d "database" ]; then
    cp -r database/* backend/database/ 2>/dev/null || true
    rm -rf database
    echo "   ✅ Moved database/ to backend/database/"
fi

# Move CSV files to backend/data/
echo "📈 Moving CSV files..."
for file in *.csv; do
    if [ -f "$file" ]; then
        mv "$file" backend/data/
        echo "   ✅ Moved $file"
    fi
done

# Clean up empty directories
echo "🧹 Cleaning up..."
rmdir data 2>/dev/null || true
rmdir database 2>/dev/null || true

# Update .gitignore
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Organized structure
archive/
backend/data/*.json
backend/scripts/__pycache__/
backend/scripts/*.pyc
backend/data/*.csv
EOF

echo "   ✅ Updated .gitignore"

# Summary
echo ""
echo "✅ File Organization Complete!"
echo "=================================================="
echo ""
echo "📁 New Structure:"
echo "   ├── backend/"
echo "   │   ├── data/          # JSON & CSV data files"
echo "   │   ├── scripts/       # Python utilities"
echo "   │   └── database/      # SQL schemas"
echo "   ├── frontend/          # React app (unchanged)"
echo "   └── archive/           # Development files"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test the backend: cd backend && npm start"
echo "   2. Verify data files are accessible"
echo "   3. Commit changes: git add . && git commit -m 'Organized file structure'"
echo "   4. Deploy to production!"
echo ""
echo "🚀 Your project is now properly organized for deployment!"