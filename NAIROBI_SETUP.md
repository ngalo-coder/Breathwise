# 🌍 UNEP Nairobi Air Quality Platform - Setup Guide

## Your Real Data Integration

You have excellent real-world Nairobi air quality data! Here's how to get it running in your UNEP platform:

### 📊 Your Data Files
- `air_quality_monitoring_zones_one.csv` - Real Nairobi monitoring stations
- `air_quality_intervention_zone.csv` - Policy intervention zones  
- `nairobi_air_quality_v1.csv` - Additional air quality data

## 🚀 Quick Start

### 1. Database Setup
```bash
# Create and initialize database
createdb unep_air
psql -d unep_air -f database/init.sql
```

### 2. Import Your Real Data
```bash
# Install Python dependencies
pip install pandas psycopg2-binary python-dotenv

# Import your Nairobi data
python import_nairobi_data.py
```

### 3. Start the Platform
```bash
# Terminal 1: Backend API
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev

# Terminal 2: Frontend
cd frontend  
cp .env.example .env
npm install
npm run dev
```

### 4. View Your Dashboard
- Open http://localhost:3000
- See your real Nairobi monitoring zones
- View policy recommendations based on your intervention zones

## 📍 Your Nairobi Data Overview

### Monitoring Zones (5 locations):
- **NBO_001** - Nairobi CBD: 45.2 μg/m³ PM2.5 (Unhealthy for Sensitive Groups)
- **NBO_002** - Industrial Area: 67.3 μg/m³ PM2.5 (Unhealthy) 
- **NBO_003** - Westlands: 32.1 μg/m³ PM2.5 (Moderate)
- **NBO_004** - Embakasi: 89.5 μg/m³ PM2.5 (Very Unhealthy) ⚠️
- **NBO_005** - Karen: 18.7 μg/m³ PM2.5 (Good) ✅

### Policy Intervention Zones (3 areas):
- **CBD** - Vehicle restrictions (Priority: 85)
- **Industrial Area** - Emission monitoring (Priority: 92) 
- **Dandora** - Waste management (Priority: 78)

## 🎯 Key Features Working

✅ **Real-time API endpoints** serving your Nairobi data  
✅ **Policy recommendations** based on your intervention zones  
✅ **Air quality categorization** using WHO 2021 guidelines  
✅ **Priority scoring** for policy interventions  
✅ **Dashboard visualization** of monitoring zones  

## 📊 API Endpoints Ready

```bash
# Get Nairobi monitoring zones
curl "http://localhost:3001/api/air/nairobi-zones"

# Get hotspots in Nairobi bounds  
curl "http://localhost:3001/api/air/hotspots?bbox=36.70,-1.40,37.12,-1.15"

# Get policy recommendations
curl "http://localhost:3001/api/policy/recommendations"

# Dashboard statistics
curl "http://localhost:3001/api/policy/dashboard"
```

## 🗺️ Next Steps for Full Platform

### 1. Add ArcGIS Mapping
```bash
# Get ArcGIS API key from developers.arcgis.com
# Add to frontend/.env:
VITE_ARCGIS_API_KEY=your_api_key_here
```

### 2. Real-time Updates
```bash
# Schedule data updates every hour
# Add to crontab:
0 * * * * cd /path/to/project && python openaq_import.py
```

### 3. Expand to Other Cities
- Duplicate your CSV structure for other UNEP cities
- Update coordinates and city names
- Run import script for each city

### 4. Policy Impact Simulation
- Use the `/api/policy/simulate` endpoint
- Test different intervention scenarios
- Measure expected PM2.5 reductions

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -d unep_air -c "SELECT COUNT(*) FROM air_measurements;"
```

### Import Script Issues
```bash
# Check file paths
ls -la *.csv

# Verify database credentials in .env
cat backend/.env
```

### Frontend Not Loading Data
```bash
# Check backend is running
curl http://localhost:3001/health

# Check browser console for errors
# Verify API calls in Network tab
```

## 📈 Expected Results

After running the import script, you should see:
- **5 monitoring zones** imported from your CSV
- **3 policy recommendations** created from intervention zones  
- **3 sample alerts** for high pollution areas
- **Dashboard showing real Nairobi data** with color-coded air quality

## 🌍 Scaling to Other UNEP Countries

Your platform is designed to scale! To add other cities:

1. **Create similar CSV files** for other locations
2. **Update coordinates** in the import script
3. **Modify city bounds** in API endpoints  
4. **Add country-specific policy templates**

The architecture supports multiple countries with the same codebase!

---

**🎯 Goal**: Transform your real Nairobi air quality data into actionable policy interventions that can scale across UNEP member countries worldwide.