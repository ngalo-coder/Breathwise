# UNEP Air Quality Platform - Backend

Node.js API Gateway with Python geospatial processing engine.

## Architecture

- **Node.js (Express)** - REST API & WebSocket server
- **Python (Flask + Celery)** - Geospatial processing with ArcPy
- **PostGIS** - Spatial database operations
- **Redis** - Task queue & caching
- **Auth0** - Authentication middleware

## Development Setup

1. **Install Node.js dependencies**
```bash
npm install
```

2. **Python environment setup**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Environment variables**
Create `.env` file:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unep_air
DB_USER=postgres
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
AUTH0_DOMAIN=your-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-secret
```

4. **Database setup**
```bash
# Install PostgreSQL + PostGIS
# Ubuntu/WSL:
sudo apt install postgresql postgresql-contrib postgis

# macOS:
brew install postgresql postgis

# Create database
createdb unep_air
psql -d unep_air -c "CREATE EXTENSION postgis;"

# Run migrations
npm run migrate
```

5. **Start services**
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Node.js API
npm run dev

# Terminal 3: Python Celery worker
celery -A tasks.air_analysis worker --loglevel=info
```

## API Endpoints

### Air Quality
- `GET /api/air/hotspots` - Get pollution hotspots
- `GET /api/air/measurements` - Get air quality measurements
- `POST /api/air/analyze` - Trigger hotspot analysis

### Policy
- `GET /api/policy/recommendations` - Get policy recommendations
- `POST /api/policy/simulate` - Simulate policy impact
- `GET /api/policy/alerts` - Get active alerts

### Real-time
- WebSocket endpoint: `ws://localhost:3001`
- Channels: `nairobi_dashboard`, `policy_alerts`

## Python Tasks

Located in `tasks/` directory:
- `air_analysis.py` - ESRI Hot Spot Analysis
- `source_attribution.py` - ML-powered source identification
- `policy_engine.py` - Policy recommendation logic

## Database Schema

Key tables:
- `air_measurements` - Spatial air quality data
- `policy_grid` - 1km x 1km policy zones
- `policy_recommendations` - Generated policy suggestions
- `alert_history` - Historical alerts and responses

## Testing

```bash
npm test
```

## Production Deployment

```bash
docker-compose up -d
```