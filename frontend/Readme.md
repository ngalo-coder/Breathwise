# UNEP Air Quality Platform - Frontend

🌍 **Modern, responsive frontend for the UNEP Air Quality Platform**

![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.6-blue.svg)
![TypeScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 **Features**

### 📊 **Real-time Dashboard**
- Live air quality monitoring with WebSocket updates
- Interactive charts and data visualizations
- Multi-source data integration (WeatherAPI, OpenAQ, Satellite)
- AI-powered insights and predictions

### 🗺️ **Interactive Map**
- Real-time pollution hotspot visualization
- Multiple map layers (monitoring stations, hotspots, weather)
- Leaflet-based mapping with custom markers
- Location-specific data popup details

### 📈 **Advanced Analytics**
- Time-series trend analysis
- Pollutant distribution charts
- Weather correlation analysis
- Data source comparison

### 🚨 **Alert Management**
- Real-time alert notifications
- Alert filtering and search
- Severity-based categorization
- Action tracking and acknowledgment

### 🛡️ **Policy Management**
- AI-generated policy recommendations
- Impact simulation and modeling
- Implementation tracking
- Stakeholder collaboration tools

## 🏗️ **Architecture**

```
src/
├── components/
│   ├── Dashboard/           # Main dashboard components
│   ├── Map/                # Interactive map components
│   ├── Analytics/          # Data visualization components
│   ├── Alerts/             # Alert management
│   └── Policy/             # Policy recommendation components
├── context/
│   ├── DataContext.js      # Global state management
│   └── SocketContext.js    # WebSocket connection
├── services/
│   └── apiService.js       # API integration layer
├── utils/                  # Utility functions
└── styles/                 # Custom styles
```

## 🛠️ **Quick Setup**

### **Prerequisites**
```bash
node --version    # Should be 18+
npm --version     # Should be 9+
```

### **Installation**
```bash
# Clone the repository
git clone https://github.com/ngalo-coder/breathwise.git
cd breathwise/frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your backend URL

# Start development server
npm start
```

### **Environment Configuration**
```env
# Required
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SOCKET_URL=http://localhost:8000

# Optional
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_GOOGLE_ANALYTICS_ID=your_ga_id
```

## 📱 **Application Structure**

### **Main Components**

#### **Dashboard** (`/`)
- Real-time air quality overview
- Key metrics and indicators
- Recent alerts and activity
- Quick action buttons

#### **Interactive Map** (`/map`)
- Live pollution visualization
- Multiple data layers
- Location-specific details
- Export and sharing capabilities

#### **Analytics** (`/analytics`)
- Comprehensive data analysis
- Customizable time ranges
- Multiple chart types
- AI-powered insights

#### **Alerts** (`/alerts`)
- Real-time alert notifications
- Advanced filtering and search
- Alert management and tracking
- Export capabilities

#### **Policy Management** (`/policy`)
- AI-generated recommendations
- Impact simulation tools
- Implementation tracking
- Stakeholder collaboration

## 🔌 **API Integration**

### **Real-time Updates**
```javascript
// WebSocket connection for live updates
const { socket, isConnected } = useSocket();

// Listen for real-time data
useEffect(() => {
  socket.on('realtime_update', (data) => {
    // Handle live data updates
  });
}, []);
```

### **Data Management**
```javascript
// Global state management
const { 
  dashboardData, 
  measurements, 
  alerts, 
  refreshData 
} = useData();
```

### **API Service Layer**
```javascript
// Service layer for API calls
import { apiService } from '../services/apiService';

// Get dashboard data
const data = await apiService.getDashboard();

// Get real-time measurements
const measurements = await apiService.getMeasurements();
```

## 🎨 **Styling & Design**

### **Design System**
- **Framework**: Tailwind CSS 3.3.6
- **Icons**: Lucide React
- **Typography**: Inter font family
- **Color Palette**: Custom air quality themed colors

### **Responsive Design**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Adaptive layouts for all screen sizes
- Touch-friendly interactions

### **Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Reduced motion preferences

## 📊 **Data Visualization**

### **Chart Libraries**
- **Recharts**: Primary charting library
- **Chart.js**: Alternative for complex visualizations
- **D3.js**: Custom data visualizations

### **Chart Types**
- Line charts for time-series data
- Bar charts for comparisons
- Pie charts for distribution
- Area charts for trend analysis
- Scatter plots for correlations

## 🔄 **State Management**

### **Context API**
```javascript
// Data Context for application state
const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  // State management logic
};

// Socket Context for real-time updates
const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  // WebSocket management
};
```

### **State Structure**
```javascript
const initialState = {
  loading: false,
  error: null,
  dashboardData: null,
  measurements: [],
  hotspots: [],
  alerts: [],
  aiAnalysis: null,
  policyRecommendations: []
};
```

## 🚀 **Build & Deployment**

### **Development**
```bash
npm start           # Start development server
npm run build       # Build for production
npm test           # Run test suite
npm run lint       # Code linting
```

### **Production Build**
```bash
npm run build      # Creates optimized build
npm run preview    # Preview production build
```

### **Deployment Options**

#### **Vercel** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **Netlify**
```bash
# Build command: npm run build
# Publish directory: build
```

#### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 **Testing**

### **Test Structure**
```bash
src/
├── __tests__/
│   ├── components/         # Component tests
│   ├── services/          # API service tests
│   └── utils/             # Utility function tests
└── setupTests.js          # Test configuration
```

### **Testing Commands**
```bash
npm test                   # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

## 📱 **Progressive Web App**

### **PWA Features**
- Offline functionality
- App-like experience
- Push notifications
- Background sync
- Install prompts

### **Service Worker**
- Cache API responses
- Offline fallbacks
- Background data sync
- Update notifications

## 🔒 **Security**

### **Security Features**
- Content Security Policy (CSP)
- XSS protection
- CSRF protection
- Secure API communication
- Environment variable protection

### **Best Practices**
- Input validation
- Secure authentication
- Data encryption
- Error handling
- Audit logging

## 📈 **Performance Optimization**

### **Optimization Techniques**
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis
- Caching strategies

### **Performance Monitoring**
```javascript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **Socket Connection Issues**
```javascript
// Check WebSocket URL in .env
REACT_APP_SOCKET_URL=http://localhost:8000
```

#### **API Connection Issues**
```javascript
// Verify backend is running
curl http://localhost:8000/health
```

## 📚 **Resources**

### **Documentation**
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US)
- [Leaflet](https://leafletjs.com/reference.html)

### **API Reference**
- Backend API documentation: `http://localhost:8000/`
- WebSocket events documentation
- Data model schemas

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### **Code Standards**
- ESLint configuration enforced
- Prettier for code formatting
- Component naming conventions
- TypeScript for new features (optional)

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **UNEP** for environmental data standards
- **OpenAQ** for open air quality data
- **WeatherAPI** for weather integration
- **React Community** for excellent tooling
- **Tailwind CSS** for utility-first styling

---

**Built with ❤️ for environmental protection and public health**