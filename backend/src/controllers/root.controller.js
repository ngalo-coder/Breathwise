// Root controller for documentation and setup guide endpoints

export const getRoot = (req, res) => {
  res.json({
    message: 'UNEP Air Quality Platform - Simplified Mode',
    description: 'Direct API integration without database dependencies',
    version: '2.1.0-simplified',
    mode: 'hackathon_ready',
    features: [
      'Real-time air quality data from multiple APIs',
      'AI-powered analysis (if OpenRouter configured)',
      'Smart hotspot detection',
      'WebSocket real-time updates',
      'No database setup required'
    ],
    quick_start: {
      '1': 'Set WEATHERAPI_KEY in .env (required)',
      '2': 'Set OPENROUTER_API_KEY for AI features (optional)',
      '3': 'npm install && npm start',
      '4': 'Visit /api/nairobi for live data'
    },
    endpoints: {
      core: {
        nairobi_data: 'GET /api/nairobi',
        measurements: 'GET /api/measurements',
        hotspots: 'GET /api/hotspots',
        alerts: 'GET /api/alerts',
        dashboard: 'GET /api/dashboard'
      },
      ai_powered: {
        ai_analysis: 'GET /api/ai/analysis',
        smart_hotspots: 'GET /api/ai/hotspots'
      },
      utilities: {
        refresh_data: 'POST /api/refresh',
        location_data: 'GET /api/location?lat=-1.29&lon=36.82',
        test_apis: 'GET /api/test-apis',
        health: 'GET /health'
      }
    },
    data_sources: [
      'WeatherAPI.com (Premium air quality + weather)',
      'OpenAQ (Global air quality network)',
      'IQAir (Commercial air quality)',
      'WAQI (World Air Quality Index)'
    ],
    websocket: {
      endpoint: `ws://localhost:${process.env.PORT || 8000}`,
      events: ['data_update', 'ai_analysis_complete', 'data_refreshed']
    },
    setup_guide: '/setup',
    github: 'https://github.com/ngalo-coder/breathwise'
  });
};

export const getSetup = (req, res) => {
  res.json({
    title: 'UNEP Air Quality Platform - Quick Setup Guide',
    description: 'Get started in 5 minutes without database setup',
    requirements: {
      required: [
        'Node.js 18+',
        'WeatherAPI.com API key (free)'
      ],
      optional: [
        'OpenRouter API key (for AI features)',
        'OpenAQ API key (enhanced data)',
        'IQAir API key (premium data)',
        'WAQI token (additional coverage)'
      ]
    },
    steps: [
      {
        step: 1,
        title: 'Get WeatherAPI Key',
        description: 'Sign up at https://www.weatherapi.com/signup.aspx',
        details: 'Free tier includes 1 million calls/month + air quality data'
      },
      {
        step: 2,
        title: 'Configure Environment',
        command: 'cp .env.example .env',
        edit: 'Add WEATHERAPI_KEY=your_key_here'
      },
      {
        step: 3,
        title: 'Install Dependencies',
        command: 'npm install'
      },
      {
        step: 4,
        title: 'Start Server',
        command: 'npm start',
        note: 'Development mode: npm run dev'
      },
      {
        step: 5,
        title: 'Test Setup',
        test: 'curl http://localhost:8000/api/nairobi',
        verify: 'Should return live Nairobi air quality data'
      }
    ],
    optional_enhancements: {
      ai_features: {
        description: 'Add AI-powered analysis and recommendations',
        setup: 'Sign up at OpenRouter.ai and add OPENROUTER_API_KEY to .env',
        benefit: 'Enables intelligent analysis, early warnings, and policy recommendations'
      },
      enhanced_data: {
        description: 'Add more data sources for better coverage',
        apis: {
          openaq: 'Free registration at OpenAQ.org',
          iqair: 'Premium service at IQAir.com',
          waqi: 'Free token at waqi.info'
        }
      }
    },
    troubleshooting: {
      'No data returned': 'Check API keys in .env file',
      'CORS errors': 'Verify FRONTEND_URL in .env and allowedOrigins in app.js',
      'Timeout errors': 'Check internet connection and API status',
      'AI features not working': 'Verify OPENROUTER_API_KEY configuration'
    },
    support: {
      documentation: 'Full API docs at /',
      test_endpoint: '/api/test-apis',
      health_check: '/health',
      github_issues: 'https://github.com/ngalo-coder/breathwise/issues'
    }
  });
};
