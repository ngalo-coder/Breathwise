import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UNEP Air Quality Platform API',
      version: '2.1.0',
      description: 'API for accessing real-time and AI-analyzed air quality data. This documentation provides detailed information about all available endpoints.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/ngalo-coder/breathwise/issues',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        CityData: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lon: { type: 'number' },
              },
            },
            measurements: { type: 'array', items: { type: 'object' } },
            summary: { type: 'object' },
            hotspots: { type: 'array', items: { type: 'object' } },
            alerts: { type: 'array', items: { type: 'object' } },
            data_sources: { type: 'array', items: { type: 'string' } },
            health_advisory: { type: 'object' },
          },
        },
        AIAnalysis: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            ai_insights: { type: 'object' },
            current_conditions: { type: 'object' },
            predictions: { type: 'object' },
            health_impact: { type: 'object' },
          },
        },
        SmartHotspots: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'FeatureCollection' },
            features: { type: 'array', items: { type: 'object' } },
            metadata: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // files containing annotations
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;