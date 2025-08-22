import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UNEP Air Quality API',
      version: '1.0.0',
      description: 'API documentation for UNEP Air Quality Platform',
    },
  },
  apis: ['./src/routes/*.js'], // files containing annotations
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;