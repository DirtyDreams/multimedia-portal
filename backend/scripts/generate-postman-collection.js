#!/usr/bin/env node

/**
 * Generate Postman Collection from OpenAPI Specification
 *
 * This script fetches the OpenAPI spec from the running backend
 * and converts it to a Postman Collection v2.1 format.
 *
 * Usage:
 *   node scripts/generate-postman-collection.js
 *   node scripts/generate-postman-collection.js --url http://localhost:3001
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const baseUrl = urlIndex !== -1 && args[urlIndex + 1]
  ? args[urlIndex + 1]
  : 'http://localhost:3000';

const openApiUrl = `${baseUrl}/api/docs-json`;
const outputPath = path.join(__dirname, '..', 'postman-collection.json');

console.log('📥 Fetching OpenAPI specification...');
console.log(`   URL: ${openApiUrl}`);

http.get(openApiUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const openApiSpec = JSON.parse(data);
      const postmanCollection = convertToPostman(openApiSpec, baseUrl);

      fs.writeFileSync(
        outputPath,
        JSON.stringify(postmanCollection, null, 2),
        'utf8'
      );

      console.log('✅ Postman collection generated successfully!');
      console.log(`   File: ${outputPath}`);
      console.log('\n📦 Import this file into Postman:');
      console.log('   1. Open Postman');
      console.log('   2. Click "Import" button');
      console.log('   3. Select the generated file');
      console.log('   4. Configure environment variables if needed');
    } catch (error) {
      console.error('❌ Error generating collection:', error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('❌ Error fetching OpenAPI spec:', error.message);
  console.error('\n💡 Make sure the backend server is running:');
  console.error('   cd backend && npm run start:dev');
  process.exit(1);
});

/**
 * Convert OpenAPI spec to Postman Collection v2.1
 */
function convertToPostman(openApiSpec, baseUrl) {
  const collection = {
    info: {
      name: openApiSpec.info.title || 'Multimedia Portal API',
      description: openApiSpec.info.description || '',
      version: openApiSpec.info.version || '1.0.0',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string',
        },
      ],
    },
    variable: [
      {
        key: 'base_url',
        value: baseUrl,
        type: 'string',
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string',
      },
    ],
    item: [],
  };

  // Group endpoints by tags
  const tagGroups = {};

  Object.entries(openApiSpec.paths || {}).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      if (method === 'parameters') return;

      const tag = operation.tags?.[0] || 'Other';

      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          name: tag,
          item: [],
        };
      }

      const request = createPostmanRequest(
        path,
        method.toUpperCase(),
        operation,
        baseUrl
      );

      tagGroups[tag].item.push(request);
    });
  });

  // Add tag groups to collection
  collection.item = Object.values(tagGroups);

  return collection;
}

/**
 * Create a Postman request item
 */
function createPostmanRequest(path, method, operation, baseUrl) {
  const request = {
    name: operation.summary || path,
    request: {
      method,
      header: [],
      url: {
        raw: `{{base_url}}${path}`,
        host: ['{{base_url}}'],
        path: path.split('/').filter(Boolean),
      },
    },
    response: [],
  };

  // Add description
  if (operation.description) {
    request.request.description = operation.description;
  }

  // Add authorization if required
  if (operation.security?.some((s) => s['JWT-auth'])) {
    request.request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string',
        },
      ],
    };
  }

  // Add request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (operation.requestBody?.content?.['application/json']?.schema) {
      const schema = operation.requestBody.content['application/json'].schema;
      const example = generateExample(schema);

      request.request.body = {
        mode: 'raw',
        raw: JSON.stringify(example, null, 2),
        options: {
          raw: {
            language: 'json',
          },
        },
      };

      request.request.header.push({
        key: 'Content-Type',
        value: 'application/json',
      });
    }
  }

  // Add query parameters
  if (operation.parameters) {
    const queryParams = operation.parameters
      .filter((p) => p.in === 'query')
      .map((p) => ({
        key: p.name,
        value: p.example || p.schema?.example || '',
        description: p.description || '',
        disabled: !p.required,
      }));

    if (queryParams.length > 0) {
      request.request.url.query = queryParams;
    }

    // Add path parameters
    const pathParams = operation.parameters
      .filter((p) => p.in === 'path')
      .map((p) => ({
        key: p.name,
        value: p.example || p.schema?.example || `:${p.name}`,
        description: p.description || '',
      }));

    if (pathParams.length > 0) {
      request.request.url.variable = pathParams;
    }
  }

  return request;
}

/**
 * Generate example data from JSON schema
 */
function generateExample(schema) {
  if (schema.example) {
    return schema.example;
  }

  if (schema.type === 'object' && schema.properties) {
    const example = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      example[key] = generateExample(prop);
    });
    return example;
  }

  if (schema.type === 'array' && schema.items) {
    return [generateExample(schema.items)];
  }

  // Default values by type
  const defaults = {
    string: 'string',
    number: 0,
    integer: 0,
    boolean: false,
    object: {},
    array: [],
  };

  return defaults[schema.type] || null;
}
