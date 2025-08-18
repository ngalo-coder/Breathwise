# 🚀 UNEP Air Quality Platform - Deployment Guide

## 🎯 Deployment Strategy
- **GitHub**: Source code repository
- **Render.com**: Backend API deployment (free tier)
- **Netlify**: Frontend deployment (free tier)

---

## 📋 Pre-Deployment Checklist

### ✅ Files to Include in Git
- All source code
- Configuration files
- Documentation
- Mock data files

### ❌ Files to Exclude from Git
- `node_modules/` folders
- `.env` files (sensitive data)
- Build artifacts
- Database files

---

## 🔧 Step 1: Prepare for GitHub

### Create .gitignore file
```gitignore
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*/dist/
*/build/

# Database files
*.db
*.sqlite
*.sqlite3

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

### Create README.md for GitHub
```markdown
# 🌍 UNEP Air Quality Policy Platform

Transform air quality data into real-time policy interventions for UNEP member countries.

## 🎯 Project Vision
Real-time air quality monitoring and policy recommendations that can scale from Nairobi to UNEP member countries worldwide.

## 🚀 Live Demo
- **Frontend**: [Your Netlify URL]
- **Backend API**: [Your Render URL]

## 🏗️ Architecture
- **Frontend**: React + TypeScript + ArcGIS Maps + Material-UI
- **Backend**: Node.js + Express + Socket.IO
- **Data**: Real Nairobi air quality monitoring zones
- **Deployment**: Netlify (frontend) + Render.com (backend)

## 📊 Features
- 🗺️ Interactive ArcGIS mapping with real-time air quality zones
- 📈 Data visualization with charts and trends
- 🏛️ Policy recommendation engine
- 📱 Mobile-responsive design
- 🔄 Auto-refresh and real-time updates
- 📤 Data export functionality

## 🌍 Current Data
- **5 Nairobi monitoring zones** with real PM2.5 data
- **3 policy intervention areas** with cost-benefit analysis
- **WHO air quality guidelines** integration

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
\`\`\`bash
# Clone repository
git clone [your-repo-url]
cd unep-air-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
\`\`\`

### Environment Variables
Create `.env` files based on `.env.example` templates.

## 🚀 Deployment

### Backend (Render.com)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

## 📈 Scaling to Other Cities
The platform is designed to scale to other UNEP member countries:
- Kampala, Uganda
- Lagos, Nigeria  
- Cairo, Egypt
- Dakar, Senegal

## 🤝 Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 📄 License
MIT License - see LICENSE file for details

## 🙏 Acknowledgments
- UNEP for environmental leadership
- OpenAQ for air quality data
- ArcGIS for mapping platform
- Material-UI for design system
```

---

## 🔧 Step 2: Prepare Backend for Render.com

### Create render.yaml
```yaml
services:
  - type: web
    name: unep-air-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: FRONTEND_URL
        fromService:
          type: web
          name: unep-air-frontend
          property: url
```

### Update backend/package.json
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "build": "echo 'No build step required'"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Create backend/.env.example
```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-netlify-app.netlify.app

# Database Configuration (for future PostgreSQL setup)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unep_air
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration (for future setup)
REDIS_URL=redis://localhost:6379/0
```

---

## 🔧 Step 3: Prepare Frontend for Netlify

### Create netlify.toml
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-render-app.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Update frontend/.env.example
```env
# API Configuration
VITE_API_URL=https://your-render-app.onrender.com

# ArcGIS Configuration
VITE_ARCGIS_API_KEY=your_arcgis_api_key

# Feature Flags
VITE_ENABLE_AUTH=false
VITE_ENABLE_REALTIME=true
```

### Update frontend/vite.config.ts for production
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          arcgis: ['@arcgis/core']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})
```

---

## 🚀 Step 4: Deployment Commands

### Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: UNEP Air Quality Platform"
```

### Create GitHub Repository
```bash
# Create repository on GitHub.com first, then:
git remote add origin https://github.com/yourusername/unep-air-platform.git
git branch -M main
git push -u origin main
```

### Deploy to Render.com (Backend)
1. Go to render.com
2. Connect GitHub account
3. Select your repository
4. Choose "Web Service"
5. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
   - **Plan**: Free

### Deploy to Netlify (Frontend)
1. Go to netlify.com
2. Connect GitHub account
3. Select your repository
4. Set:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Base Directory**: `frontend`

---

## 🔧 Step 5: Environment Variables Setup

### Render.com Environment Variables
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### Netlify Environment Variables
```
VITE_API_URL=https://your-render-app.onrender.com
VITE_ARCGIS_API_KEY=your_arcgis_api_key
VITE_ENABLE_REALTIME=true
```

---

## 🎯 Post-Deployment Checklist

### ✅ Test Deployment
- [ ] Backend health check: `https://your-render-app.onrender.com/health`
- [ ] API endpoints: `https://your-render-app.onrender.com/api/air/nairobi-zones`
- [ ] Frontend loads: `https://your-netlify-app.netlify.app`
- [ ] Map displays correctly
- [ ] Data loads from API
- [ ] Charts render properly

### ✅ Update URLs
- [ ] Update README.md with live URLs
- [ ] Update CORS settings in backend
- [ ] Test cross-origin requests

### ✅ Performance Optimization
- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Enable CDN caching
- [ ] Monitor performance metrics

---

## 🌟 Success Metrics

After deployment, your platform will be:
- **Globally accessible** via HTTPS
- **Automatically updated** on git push
- **Scalable** with free tier limits
- **Professional** with custom domains (optional)

## 🎉 Next Steps After Deployment

1. **Share with stakeholders** - Send live URLs
2. **Monitor performance** - Check Render/Netlify dashboards  
3. **Add custom domain** - Optional professional touch
4. **Scale to other cities** - Add more monitoring zones
5. **Integrate real-time data** - Connect to live APIs

Your UNEP Air Quality Platform will be live and accessible worldwide! 🌍