/**
 * Script to generate API assets (OpenAPI spec and Bruno collection)
 * Run with: npx tsx scripts/generate-api.ts
 */

import swaggerJsdoc from 'swagger-jsdoc';
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from 'fs';
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
        url: 'http://localhost:3001/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        ProfileId: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Profile-Id',
        },
      },
    },
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

const swaggerSpec = swaggerJsdoc(options) as any;

// --- Generate OpenAPI JSON ---
const landingPublicDir = join(__dirname, '../apps/landing/public');
mkdirSync(landingPublicDir, { recursive: true });
writeFileSync(
  join(landingPublicDir, 'openapi.json'),
  JSON.stringify(swaggerSpec, null, 2)
);
console.log('✅ OpenAPI spec generated at apps/landing/public/openapi.json');

// --- Generate Bruno Collection ---
const brunoDir = join(__dirname, '../apps/api/bruno');
const baseUrl = '{{baseUrl}}';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getSafeFilename(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, '-');
}

console.log('Generating Bruno collection...');

// 1. Get all paths and group by tag
const paths = swaggerSpec.paths;
const requestsByTag: Record<string, any[]> = {};

Object.entries(paths).forEach(([path, methods]: [string, any]) => {
  Object.entries(methods).forEach(([method, detail]: [string, any]) => {
    const tag = detail.tags?.[0] || 'Other';
    if (!requestsByTag[tag]) requestsByTag[tag] = [];
    requestsByTag[tag].push({ path, method, detail });
  });
});

// 2. Process each tag (folder)
Object.entries(requestsByTag).forEach(([tag, requests]) => {
  const tagSlug = slugify(tag);
  const folderPath = join(brunoDir, tagSlug);
  
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
  } else {
    // Clean up existing .bru files in this folder to avoid duplicates/stale files
    readdirSync(folderPath).forEach(file => {
      if (file.endsWith('.bru')) {
        unlinkSync(join(folderPath, file));
      }
    });
  }

  requests.forEach(({ path, method, detail }, index) => {
    const name = detail.summary || detail.operationId || `${method.toUpperCase()} ${path}`;
    const filename = `${getSafeFilename(name)}.bru`;
    const filePath = join(folderPath, filename);

    // Prepare Bruno content
    let content = `meta {
  name: ${name}
  type: http
  seq: ${index + 1}
}

${method} {
  url: ${baseUrl}${path.replace(/\{([^}]+)\}/g, ':$1')}
  body: ${method === 'get' || method === 'delete' ? 'none' : 'json'}
  auth: none
}

`;

    // Add headers
    content += `headers {
  X-Profile-Id: {{profileId}}
}

`;

    // Add body if applicable
    if (method !== 'get' && method !== 'delete') {
      content += `body:json {
  {}
}

`;
    }

    // Add docs
    content += `docs {
  # ${name}
  
  ${detail.description || 'No description provided.'}
  
  ## Endpoint
  \`${method.toUpperCase()} ${path}\`
}
`;

    writeFileSync(filePath, content);
  });
});

console.log('✅ Bruno collection updated at apps/api/bruno/');
