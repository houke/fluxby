import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description:
        'API voor het beheren van financiële transacties, categorieën en analytics',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Transactions', description: 'Transactie beheer' },
      { name: 'Categories', description: 'Categorie beheer' },
      { name: 'Accounts', description: 'Rekening beheer' },
      { name: 'Budgets', description: 'Budget beheer' },
      { name: 'Import', description: 'CSV import' },
      { name: 'Analytics', description: 'Dashboard en statistieken' },
      { name: 'User', description: 'Gebruikersprofiel' },
      { name: 'Rules', description: 'Auto-categorisatie regels' },
      { name: 'Data', description: 'Export en import van alle gegevens' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
