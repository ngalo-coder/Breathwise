# 🗺️ Get Your Free ArcGIS API Key

## Quick Steps (5 minutes):

### 1. Visit ArcGIS Developers

Go to: https://developers.arcgis.com

### 2. Sign Up (Free)

- Click "Sign up for free"
- Use your email address
- Complete the registration

### 3. Create API Key

- Go to "API Keys" in your dashboard
- Click "Create API Key"
- Name it: "UNEP Air Quality Platform"
- Copy the API key

### 4. Add to Your Project

Add this line to `frontend/.env`:

```
VITE_ARCGIS_API_KEY=your_api_key_here
```

### 5. Restart Frontend

```bash
# Stop frontend (Ctrl+C) then restart:
npm run dev
```

## Free Tier Limits:

- ✅ 1,000,000 basemap tiles/month
- ✅ 20,000 geocoding requests/month
- ✅ 5,000 routing requests/month
- ✅ Perfect for development and demos

## Alternative: Use Without API Key

If you prefer to test immediately, the map will work with Esri's default basemap, but you'll see a watermark.

Your enhanced dashboard will work either way!
