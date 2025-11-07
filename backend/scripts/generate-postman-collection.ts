/**
 * Generate Postman Collection from OpenAPI Specification
 *
 * This script generates a Postman collection from the Swagger/OpenAPI document
 * exported by the NestJS application.
 *
 * Usage:
 *   1. Start the backend server: npm run start:dev
 *   2. Run this script: npx ts-node scripts/generate-postman-collection.ts
 *   3. Import the generated postman-collection.json into Postman
 */

import * as fs from 'fs';
import * as path from 'path';

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  auth?: {
    type: string;
    bearer: Array<{ key: string; value: string; type: string }>;
  };
  item: PostmanItem[];
  variable: Array<{ key: string; value: string; type: string }>;
}

interface PostmanItem {
  name: string;
  description?: string;
  item?: PostmanItem[];
  request?: {
    method: string;
    header: Array<{ key: string; value: string; type: string }>;
    body?: {
      mode: string;
      raw: string;
      options?: {
        raw: { language: string };
      };
    };
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string; description: string }>;
    };
    auth?: {
      type: string;
      bearer?: Array<{ key: string; value: string; type: string }>;
    };
    description?: string;
  };
}

async function generatePostmanCollection() {
  console.log('🔄 Fetching OpenAPI specification from backend...');

  try {
    // Fetch OpenAPI spec from running backend
    const response = await fetch('http://localhost:4000/api-docs-json');
    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAPI spec: ${response.statusText}\n` +
          'Make sure the backend server is running on port 4000.',
      );
    }

    const openApiSpec: any = await response.json();

    console.log('✅ OpenAPI specification fetched successfully');
    console.log('🔄 Converting to Postman collection...');

    const collection: PostmanCollection = {
      info: {
        name: openApiSpec.info.title || 'Multimedia Portal API',
        description: openApiSpec.info.description || '',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{access_token}}',
            type: 'string',
          },
        ],
      },
      item: [],
      variable: [
        {
          key: 'base_url',
          value: 'http://localhost:4000',
          type: 'string',
        },
        {
          key: 'access_token',
          value: '',
          type: 'string',
        },
        {
          key: 'refresh_token',
          value: '',
          type: 'string',
        },
      ],
    };

    // Group endpoints by tags
    const tagGroups: { [tag: string]: PostmanItem[] } = {};

    for (const [path, methods] of Object.entries<any>(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        if (typeof operation !== 'object') continue;

        const tag = operation.tags?.[0] || 'Other';
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }

        const item: PostmanItem = {
          name: operation.summary || `${method.toUpperCase()} ${path}`,
          description: operation.description || '',
          request: {
            method: method.toUpperCase(),
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
                type: 'text',
              },
            ],
            url: {
              raw: `{{base_url}}${path}`,
              host: ['{{base_url}}'],
              path: path.split('/').filter((p) => p),
            },
            description: operation.description || '',
          },
        };

        // Add authentication if required
        if (operation.security) {
          item.request.auth = {
            type: 'bearer',
            bearer: [
              {
                key: 'token',
                value: '{{access_token}}',
                type: 'string',
              },
            ],
          };
        }

        // Add request body example
        if (operation.requestBody?.content?.['application/json']?.schema) {
          const schema = operation.requestBody.content['application/json'].schema;
          const example = generateExampleFromSchema(schema, openApiSpec);

          item.request.body = {
            mode: 'raw',
            raw: JSON.stringify(example, null, 2),
            options: {
              raw: { language: 'json' },
            },
          };
        }

        // Add query parameters
        if (operation.parameters) {
          item.request.url.query = operation.parameters
            .filter((p: any) => p.in === 'query')
            .map((p: any) => ({
              key: p.name,
              value: p.example || '',
              description: p.description || '',
            }));
        }

        tagGroups[tag].push(item);
      }
    }

    // Convert tag groups to collection items
    for (const [tag, items] of Object.entries(tagGroups)) {
      collection.item.push({
        name: tag,
        description: openApiSpec.tags?.find((t: any) => t.name === tag)
          ?.description,
        item: items,
      });
    }

    // Write collection to file
    const outputPath = path.join(
      __dirname,
      '..',
      'postman-collection.json',
    );
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

    console.log('✅ Postman collection generated successfully');
    console.log(`📄 Output: ${outputPath}`);
    console.log('\n📚 Import this file into Postman to test the API');
    console.log('\n🔐 Authentication Setup:');
    console.log('1. Send POST request to /auth/login');
    console.log('2. Copy the access_token from response');
    console.log(
      '3. Set the {{access_token}} variable in Postman environment',
    );
    console.log('4. All authenticated requests will use this token\n');

    return outputPath;
  } catch (error) {
    console.error('❌ Error generating Postman collection:', error);
    throw error;
  }
}

function generateExampleFromSchema(
  schema: any,
  openApiSpec: any,
): any {
  // If schema has example, use it
  if (schema.example) return schema.example;

  // If schema is a reference, resolve it
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    const refSchema = openApiSpec.components?.schemas?.[refPath];
    if (refSchema) {
      return generateExampleFromSchema(refSchema, openApiSpec);
    }
  }

  // Generate example based on schema type
  if (schema.type === 'object' && schema.properties) {
    const example: any = {};
    for (const [key, prop] of Object.entries<any>(schema.properties)) {
      if (prop.example !== undefined) {
        example[key] = prop.example;
      } else if (prop.$ref) {
        example[key] = generateExampleFromSchema(prop, openApiSpec);
      } else {
        example[key] = generateValueExample(prop);
      }
    }
    return example;
  }

  return generateValueExample(schema);
}

function generateValueExample(schema: any): any {
  switch (schema.type) {
    case 'string':
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.enum) return schema.enum[0];
      return schema.example || 'string';
    case 'number':
    case 'integer':
      return schema.example || 0;
    case 'boolean':
      return schema.example || false;
    case 'array':
      if (schema.items) {
        return [generateExampleFromSchema(schema.items, {})];
      }
      return [];
    default:
      return null;
  }
}

// Run if called directly
if (require.main === module) {
  generatePostmanCollection().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { generatePostmanCollection };
