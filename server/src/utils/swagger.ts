export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CareCompanion API',
    version: '1.0.0',
    description: 'Elderly Care & Medication Management Platform API',
    contact: { name: 'CareCompanion Support', email: 'support@carecompanion.app' },
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { tags: ['Health'], summary: 'Liveness check', security: [], responses: { '200': { description: 'OK' } } } },
    '/health/ready': { get: { tags: ['Health'], summary: 'Readiness check', security: [], responses: { '200': { description: 'Ready' }, '503': { description: 'Not ready' } } } },
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'role', 'firstName', 'lastName'], properties: { email: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', enum: ['SENIOR', 'CAREGIVER'] }, firstName: { type: 'string' }, lastName: { type: 'string' } } } } } },
        responses: { '201': { description: 'User created' }, '409': { description: 'Email exists' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { '200': { description: 'JWT access token + refresh cookie' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Refresh access token using httpOnly cookie', security: [], responses: { '200': { description: 'New access token' } } } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout and revoke refresh token', responses: { '200': { description: 'Logged out' } } } },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Get current user', responses: { '200': { description: 'User object' } } } },
    '/medications': {
      get: { tags: ['Medications'], summary: 'List medications', responses: { '200': { description: 'Array of medications' } } },
      post: { tags: ['Medications'], summary: 'Create medication', responses: { '201': { description: 'Created' } } },
    },
    '/doses/today': { get: { tags: ['Doses'], summary: "Today's doses with medication info", responses: { '200': { description: 'Array of dose logs' } } } },
    '/doses/{id}/take': { post: { tags: ['Doses'], summary: 'Mark dose as taken (decrements stock)', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated dose' } } } },
    '/doses/{id}/skip': { post: { tags: ['Doses'], summary: 'Skip a dose', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated dose' } } } },
    '/doses/{id}/snooze': { post: { tags: ['Doses'], summary: 'Snooze a dose', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated dose' } } } },
    '/vitals': {
      get: { tags: ['Vitals'], summary: 'List vitals', responses: { '200': { description: 'Array of vitals' } } },
      post: { tags: ['Vitals'], summary: 'Record a vital', responses: { '201': { description: 'Created' } } },
    },
    '/vitals/trends': { get: { tags: ['Vitals'], summary: 'Get vitals trends (7 or 30 days)', responses: { '200': { description: 'Trends by type' } } } },
    '/checkin': { post: { tags: ['Check-in'], summary: 'Post daily I\'m OK check-in', responses: { '201': { description: 'Created' } } } },
    '/interactions/check': { get: { tags: ['Interactions'], summary: 'Check drug interactions', security: [], parameters: [{ in: 'query', name: 'medicines', required: true, schema: { type: 'string' }, description: 'Comma-separated medicine names' }], responses: { '200': { description: 'Warnings array' } } } },
    '/caregiver/seniors': { get: { tags: ['Caregiver'], summary: 'List linked seniors', responses: { '200': { description: 'Array of seniors' } } } },
    '/caregiver/seniors/{seniorId}/dashboard': { get: { tags: ['Caregiver'], summary: 'Senior dashboard with adherence, heatmap, alerts', parameters: [{ in: 'path', name: 'seniorId', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Dashboard data' } } } },
    '/reports/doctor-summary': { get: { tags: ['Reports'], summary: 'Doctor visit summary with adherence and vitals', responses: { '200': { description: 'Summary data' } } } },
    '/account/export': { get: { tags: ['Account'], summary: 'Export all user data (GDPR)', responses: { '200': { description: 'JSON export' } } } },
    '/account': { delete: { tags: ['Account'], summary: 'Delete account (GDPR)', responses: { '200': { description: 'Deleted' } } } },
  },
};
