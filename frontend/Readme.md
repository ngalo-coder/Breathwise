# UNEP Air Quality Platform - Frontend

React + TypeScript frontend with ArcGIS mapping and real-time policy dashboard.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **ArcGIS Maps SDK** for geospatial visualization
- **Material-UI 5** for UNEP-compliant design
- **Socket.IO** for real-time updates
- **React Query** for data fetching
- **Auth0** for authentication

## Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Environment variables**
Create `.env` file:
```env
VITE_API_URL=http://localhost:3001
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_ARCGIS_API_KEY=your-arcgis-key
```

3. **Start development server**
```bash
npm run dev
```

## Key Components

- `PolicyMap.tsx` - ArcGIS-powered air quality map
- `PolicyDashboard.tsx` - Real-time policy recommendations
- `AlertSystem.tsx` - Pollution hotspot alerts
- `CountrySelector.tsx` - Multi-country support

## Features

- 🗺️ Interactive air quality mapping
- 📊 Real-time pollution data visualization
- 🚨 Automated policy alerts
- 📱 Responsive design for mobile/desktop
- 🌍 Multi-language support
- 🔐 Secure authentication

## Build

```bash
npm run build
```

Built files will be in `dist/` directory.