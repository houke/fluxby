/**
 * Script to generate OpenAPI spec from swagger-jsdoc
 * Run with: npx tsx scripts/generate-openapi.ts
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fluxby API',
      version: '1.0.0',
      description:
        'API for managing financial transactions, categories, budgets, and analytics. This API is intended for developers building custom interfaces.',
      license: {
        name: 'MIT',
        url: 'https://github.com/fluxby/fluxby/blob/main/LICENSE',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local development server',
      },
    ],
    tags: [
      { name: 'Profiles', description: 'Multi-profile management' },
      { name: 'Accounts', description: 'Bank account management' },
      { name: 'Transactions', description: 'Transaction management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Budgets', description: 'Budget management' },
      { name: 'Import', description: 'CSV import' },
      { name: 'Analytics', description: 'Dashboard and statistics' },
      { name: 'Address Book', description: 'Contact management' },
      { name: 'Rules', description: 'Auto-categorization rules' },
      { name: 'Data', description: 'Export and import of all data' },
    ],
  },
  apis: [join(__dirname, '../apps/api/src/routes/*.ts')],
};

const swaggerSpec = swaggerJsdoc(options);

// Ensure output directory exists
const outputDir = join(__dirname, '../apps/landing/public');
mkdirSync(outputDir, { recursive: true });

// Write OpenAPI spec
writeFileSync(
  join(outputDir, 'openapi.json'),
  JSON.stringify(swaggerSpec, null, 2)
);

// eslint-disable-next-line no-console
console.log('✅ OpenAPI spec generated at apps/landing/public/openapi.json');
