# UNEP Air Quality Platform - Quick Setup Guide

## Prerequisites

Make sure you have the following installed:
- Node.js 18+ 
- Python 3.9+
- PostgreSQL with PostGIS extension
- Redis server

## Quick Start (Development)

### 1. Database Setup

```bash
# Install PostgreSQL + PostGIS (Ubuntu/WSL)
sudo apt update
sudo apt install postgresql postgresql-contrib postgis

# Or on macOS
brew install postgresql postgis

# Create database
sudo -u postgres createdb unep_air
sudo -u postgres psql -d unep_air -c "CREATE EXTENSION postgis;"

# Initialize schema
psql -d unep_air -f database/init.sql
```

### 2. Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Setup Python environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Start the API server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env if needed

# Start development server
npm run dev
```

### 4. Start Services

You'll need 4 terminal windows:

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: PostgreSQL (if not running as service)
postgres -D /usr/local/var/postgres

# Terminal 3: Backend API
cd backend && npm run dev

# Terminal 4: Frontend
cd frontend && npm run dev
```

### 5. Optional: Python Tasks

```bash
# Terminal 5: Celery worker (for background tasks)
cd backend
source venv/bin/activate
celery -A tasks.air_analysis worker --loglevel=info
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Health Check: http://localhost:8001/health

## Docker Setup (Alternative)

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Testing

Test the API endpoints:

```bash
# Get hotspots
curl "http://localhost:3001/api/air/hotspots?bbox=36.7,-1.4,36.9,-1.1"

# Get policy recommendations
curl "http://localhost:3001/api/policy/recommendations"

# Get dashboard stats
curl "http://localhost:3001/api/policy/dashboard"
```

## Next Steps

1. Configure ArcGIS API key for mapping
2. Set up Auth0 for authentication (optional)
3. Add real data sources
4. Customize for your country/city
5. Deploy to production

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify database exists: `psql -l`
- Check PostGIS extension: `psql -d unep_air -c "SELECT PostGIS_Version();"`

### Port Conflicts
- Backend: Change PORT in backend/.env
- Frontend: Change port in vite.config.ts
- Database: Change DB_PORT in backend/.env

### Python Dependencies
- Install system dependencies: `sudo apt install python3-dev libpq-dev`
- Use virtual environment: `python -m venv venv && source venv/bin/activate`

## Development Tips

- Use `npm run dev` for hot reloading
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Use PostgreSQL logs for database debugging
- Redis CLI: `redis-cli` for cache inspection