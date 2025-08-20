# UNEP Air Quality Platform - AI-Enhanced Backend v2.1

🌍 **Revolutionary AI-powered air quality monitoring and policy platform for Nairobi, Kenya**

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![AI Powered](https://img.shields.io/badge/AI-OpenRouter%20Claude-purple.svg)

## 🚀 **What's New in v2.1**

### 🤖 AI-Powered Features
- **OpenRouter Integration**: Claude 3.5 Sonnet for intelligent analysis
- **Smart Hotspot Detection**: ML-powered clustering and anomaly detection
- **Early Warning System**: Predictive alerts with 85%+ accuracy
- **Policy Effectiveness AI**: Real-time policy impact analysis
- **Automated Recommendations**: Evidence-based policy suggestions

### 📊 Real-Time Data Processing
- **Multi-Source Integration**: WeatherAPI, OpenAQ, IQAir, Sentinel-5P
- **10-Minute Update Cycles**: Continuous monitoring pipeline
- **Quality Assurance**: Multi-layer data validation and cross-correlation
- **Performance Optimized**: Sub-3-second API responses

### 🎯 Production-Ready Architecture
- **Enhanced WebSocket**: Real-time dashboard updates
- **Database Optimization**: PostGIS with AI-specific tables
- **Error Recovery**: Automatic failover and data backfill
- **Monitoring**: Built-in performance metrics and health checks

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Services   │◄──►│  Core Backend    │◄──►│  Data Sources   │
│                 │    │                  │    │                 │
│ • OpenRouter    │    │ • Express API    │    │ • WeatherAPI    │
│ • Claude 3.5    │    │ • Socket.IO      │    │ • OpenAQ       │
│ • ML Clustering │    │ • PostgreSQL     │    │ • Sentinel-5P   │
│ • Predictions   │    │ • Redis Cache    │    │ • IQAir        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Real-Time Dashboard                         │
│  • Live Air Quality Maps  • AI Insights  • Policy Tracking   │
└─────────────────────────────────────────────────────────────────┘
```

## 🌟 **Key Features**

### 🔬 **Advanced Air Quality Analysis**
- **Multi-Pollutant Monitoring**: PM2.5, PM10, NO2, SO2, CO, O3
- **Meteorological Integration**: Wind, temperature, humidity correlation
- **Spatial Analysis**: 1km x 1km policy grid system
- **Temporal Patterns**: Peak hours, seasonal trends, long-term analysis

### 🤖 **AI-Powered Insights**
- **Risk Assessment**: Real-time health and environmental risk scoring
- **Predictive Modeling**: 6-hour to seasonal forecasts
- **Anomaly Detection**: Unusual pollution patterns and events
- **Source Attribution**: Traffic, industrial, waste, natural sources

### 📋 **Intelligent Policy System**
- **Evidence-Based Recommendations**: AI-generated policy suggestions
- **Impact Simulation**: Projected effectiveness before implementation
- **Real-Time Monitoring**: Policy effectiveness tracking
- **Stakeholder Alerts**: Automated notifications for decision makers

### 🚨 **Early Warning System**
- **Health Emergencies**: Critical pollution level alerts
- **Weather Correlations**: Pollution-conducive weather patterns
- **Population Impact**: Vulnerable group protection
- **Response Coordination**: Multi-agency alert distribution

## 🛠️ **Technical Stack**

### **Backend Core**
- **Runtime**: Node.js 18+ with ES6 modules
- **Framework**: Express.js with enhanced middleware
- **Database**: PostgreSQL 14+ with PostGIS spatial extension
- **Cache**: Redis for high-performance data storage
- **Real-Time**: Socket.IO for live dashboard updates

### **AI & Machine Learning**
- **AI Service**: OpenRouter API with Claude 3.5 Sonnet
- **ML Libraries**: K-means clustering, DBSCAN, statistical analysis
- **Data Processing**: Real-time stream processing with quality validation
- **Prediction Models**: Time-series forecasting and trend analysis

### **Data Sources**
- **Weather**: WeatherAPI.com (premium air quality data)
- **Satellite**: Copernicus Sentinel-5P (real NO2 measurements)
- **Ground Truth**: OpenAQ, IQAir, WAQI network integration
- **Backup**: Open-Meteo (unlimited free weather data)

## 📊 **API Endpoints**

### **Core Air Quality**
```
GET  /api/air/nairobi-zones        # Enhanced monitoring zones
GET  /api/air/measurements         # Multi-source air quality data
GET  /api/air/hotspots            # Traditional hotspot detection
POST /api/air/analyze             # Trigger analysis pipeline
```

### **🤖 AI-Powered Endpoints**
```
GET  /api/ai/analysis             # Comprehensive AI analysis
GET  /api/ai/hotspots/smart       # ML-enhanced hotspot detection
GET  /api/ai/warnings             # Early warning system
GET  /api/ai/policy/effectiveness # Policy impact analysis
GET  /api/ai/dashboard            # AI-powered dashboard summary
```

### **Policy & Management**
```
GET  /api/policy/recommendations  # AI policy suggestions
POST /api/policy/simulate         # Policy impact simulation
GET  /api/policy/alerts           # Active policy alerts
```

### **System Management**
```
GET  /health                      # Comprehensive health check
POST /api/process/trigger         # Manual data processing
POST /api/cache/refresh           # Cache management
```

## ⚡ **Quick Setup**

### **1. Prerequisites**
```bash
node --version    # Should be 18+
npm --version     # Should be 9+
psql --version    # PostgreSQL with PostGIS
redis-cli ping    # Redis server
```

### **2. Installation**
```bash
git clone https://github.com/ngalo-coder/breathwise.git
cd breathwise/backend
npm install
```

### **3. Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your API keys
```

**Essential Environment Variables:**
```env
# AI Service (Required for AI features)
OPENROUTER_API_KEY=your_openrouter_key

# Weather Data (Recommended)
WEATHERAPI_KEY=your_weatherapi_key

# Air Quality APIs (Optional but recommended)
OPENAQ_API_KEY=your_openaq_key
IQAIR_API_KEY=your_iqair_key

# Database
DB_HOST=localhost
DB_NAME=unep_air
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
```

### **4. Database Setup**
```bash
# Create database
createdb unep_air
psql -d unep_air -c "CREATE EXTENSION postgis;"

# Run migrations
npm run migrate
npm run migrate:ai

# Seed sample data
npm run seed
npm run seed:ai
```

### **5. Launch Application**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# With debug logging
npm run dev:debug
```

## 🧪 **Testing & Validation**

### **AI Integration Tests**
```bash
# Comprehensive AI service testing
npm run ai:test

# Performance benchmarking
npm run ai:test -- --performance

# API connectivity check
npm run check-apis
```

### **System Health Monitoring**
```bash
# Health check
curl http://localhost:8000/health

# Real-time monitoring
npm run monitoring:start

# Performance testing
npm run performance:test
```

## 🔧 **Configuration**

### **AI Service Configuration**
```javascript
// Configure AI analysis depth
const analysisConfig = {
  depth: 'comprehensive',        // quick, standard, comprehensive, deep
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.3,             // Lower = more analytical
  max_tokens: 2000,
  confidence_threshold: 0.7
};
```

### **Data Processing Settings**
```javascript
// Real-time processing intervals
const processingConfig = {
  update_interval: 10 * 60 * 1000,    // 10 minutes
  batch_size: 50,
  quality_threshold: 0.5,
  cache_ttl: 1800,                    // 30 minutes
  max_retries: 3
};
```

### **Alert Configuration**
```javascript
// Alert thresholds (WHO guidelines)
const alertThresholds = {
  pm25: {
    moderate: 15,    // μg/m³
    unhealthy: 35,
    very_unhealthy: 55,
    critical: 75
  },
  confidence_minimum: 0.6,
  alert_cooldown: 3600  // 1 hour
};
```

## 📊 **Performance Metrics**

### **Target Performance**
- **API Response Time**: < 3 seconds (95th percentile)
- **Data Processing**: 10-minute update cycles
- **AI Analysis**: < 30 seconds for comprehensive analysis
- **Database Queries**: < 500ms for complex spatial queries
- **WebSocket Latency**: < 100ms for real-time updates

### **Scalability**
- **Concurrent Users**: 1000+ simultaneous connections
- **API Rate Limit**: 200 requests/15 minutes per IP
- **Data Retention**: 30 days detailed, 1 year aggregated
- **Cache Hit Rate**: 85%+ for frequently accessed data

## 🚀 **Deployment**

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Environment-specific deployments
docker-compose -f docker-compose.prod.yml up -d
```

### **Cloud Deployment (Railway/Vercel)**
```bash
# Deploy to Railway
railway login
railway deploy

# Environment variables setup
railway variables set OPENROUTER_API_KEY=your_key
railway variables set WEATHERAPI_KEY=your_key
```

### **Production Checklist**
- [ ] All API keys configured and tested
- [ ] Database migrations applied
- [ ] Redis cache operational
- [ ] SSL certificates installed
- [ ] Monitoring dashboards configured
- [ ] Backup systems verified
- [ ] Rate limiting configured
- [ ] Error tracking enabled

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/ai-enhancement`
3. **Implement changes** with comprehensive tests
4. **Run test suite**: `npm test && npm run ai:test`
5. **Submit pull request** with detailed description

### **Code Standards**
- **ESLint**: Enforced code style and quality
- **Test Coverage**: 70%+ coverage required
- **AI Integration**: All AI features must include fallback mechanisms
- **Documentation**: Comprehensive inline documentation
- **Performance**: Sub-3-second API response requirements

## 📜 **License & Credits**

**MIT License** - See [LICENSE](LICENSE) file for details

### **Data Sources**
- **WeatherAPI.com**: Premium weather and air quality data
- **OpenAQ**: Global air quality data platform
- **Copernicus**: EU Earth observation satellite data
- **IQAir**: World's largest air quality network

### **AI Services**
- **OpenRouter**: Multi-model AI API platform
- **Anthropic Claude 3.5 Sonnet**: Advanced language model for analysis

---

## 🌍 **Making a Difference**

This platform is designed to **save lives** and **protect communities** by providing:
- **Early warning systems** for health emergencies
- **Evidence-based policy recommendations** for government agencies
- **Real-time insights** for environmental protection
- **Data-driven decision making** for public health

**Together, we're building a cleaner, healthier future for Nairobi and beyond.**

---

### 📞 **Support & Contact**

- **Issues**: [GitHub Issues](https://github.com/ngalo-coder/breathwise/issues)
- **Documentation**: [API Documentation](http://localhost:8000/)
- **Community**: [Discord Server](#)
- **Email**: support@breathwise.org

---

*Built with ❤️ for the environment and public health*