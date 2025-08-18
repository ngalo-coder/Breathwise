# UNEP Air Quality Policy Platform

🎯 **Project Vision**: Transform Nairobi's air quality data into real-time policy interventions that can scale to UNEP member countries worldwide.

## Architecture Overview

### Frontend Stack
- React 18 + TypeScript + Vite
- ArcGIS Maps SDK for JavaScript 4.28
- Material-UI 5 for UNEP-compliant design
- Socket.IO for real-time updates

### Backend Stack
- Node.js (Express) - API Gateway & Authentication
- Python (Flask + Celery) - Geospatial processing with ArcPy
- PostGIS - Spatial database (PostgreSQL + PostGIS extension)
- Redis - Task queue & caching
- Auth0 - Authentication for UNEP staff

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL with PostGIS extension
- Redis

### Development Setup

1. **Clone and setup**
```bash
git clone <repository>
cd unep-air-platform
```

2. **Frontend setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Backend setup**
```bash
cd backend
npm install
npm run dev
```

4. **Python environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. **Database setup**
```bash
# Create database
createdb unep_air
psql -d unep_air -c "CREATE EXTENSION postgis;"
```

## Project Structure

```
unep-air-platform/
├── frontend/          # React + TypeScript frontend
├── backend/           # Node.js API + Python processing
├── database/          # SQL schemas and migrations
├── docs/              # Documentation
└── docker-compose.yml # Development environment
```

## Features

- 🗺️ Real-time air quality mapping with ArcGIS
- 📊 Policy dashboard with impact predictions
- 🚨 Automated alerts for pollution hotspots
- 🔬 ML-powered source attribution
- 📋 Policy recommendation engine
- 🌍 Multi-country configuration system

## Development Status

This is a 10-day implementation sprint project. See individual README files in frontend/ and backend/ directories for detailed setup instructions.