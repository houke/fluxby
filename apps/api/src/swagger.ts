import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fluxby API',
      version: '1.0.0',
      description:
        'API for managing financial transactions, categories, budgets, and analytics. Used for development and headless mode.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Transactions', description: 'Transaction management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Accounts', description: 'Account management' },
      { name: 'Budgets', description: 'Budget management' },
      { name: 'Import', description: 'CSV import' },
      { name: 'Analytics', description: 'Dashboard and statistics' },
      { name: 'User', description: 'User profile' },
      { name: 'Rules', description: 'Auto-categorization rules' },
      { name: 'Data', description: 'Export and import of all data' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
