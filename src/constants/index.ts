// Application Constants

// Sample API Specification
export const SAMPLE_API_SPEC_JSON = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample Pet Store API",
    "version": "1.0.0",
    "description": "A sample API to manage pets in a store"
  },
  "servers": [
    {
      "url": "http://localhost:3000/api/v1"
    }
  ],
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "operationId": "listPets",
        "tags": ["pets"],
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "description": "How many items to return at one time (max 100)",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "A paged array of pets",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Pet"
                  }
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create a pet",
        "operationId": "createPet",
        "tags": ["pets"],
        "requestBody": {
          "description": "Pet to add to the store",
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PetInput"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Pet created successfully"
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/pets/{petId}": {
      "get": {
        "summary": "Info for a specific pet",
        "operationId": "showPetById",
        "tags": ["pets"],
        "parameters": [
          {
            "name": "petId",
            "in": "path",
            "required": true,
            "description": "The id of the pet to retrieve",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Expected response to a valid request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pet"
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update a pet",
        "operationId": "updatePet",
        "tags": ["pets"],
        "parameters": [
          {
            "name": "petId",
            "in": "path",
            "required": true,
            "description": "The id of the pet to update",
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "description": "Pet object that needs to be updated",
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PetInput"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Pet updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pet"
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Deletes a pet",
        "operationId": "deletePet",
        "tags": ["pets"],
        "parameters": [
          {
            "name": "petId",
            "in": "path",
            "required": true,
            "description": "The id of the pet to delete",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Pet deleted successfully"
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Pet": {
        "type": "object",
        "required": ["id", "name"],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "readOnly": true
          },
          "name": {
            "type": "string"
          },
          "tag": {
            "type": "string"
          },
          "age": {
            "type": "integer",
            "format": "int32",
            "description": "Age of the pet in years"
          }
        }
      },
      "PetInput": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string"
          },
          "tag": {
            "type": "string"
          },
          "age": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "Error": {
        "type": "object",
        "required": ["code", "message"],
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          }
        }
      }
    }
  }
}`;

// Default Configuration Values
export const DEFAULT_CONFIG = {
  FRAMEWORK: 'hono',
  RUNTIME: 'nodejs',
  DEPLOYMENT_TARGET: 'vercel',
  TYPESCRIPT: true,
  INPUT_VALIDATION: true,
  GENERATE_DOCS: true,
} as const;

// Framework Options
export const FRAMEWORK_OPTIONS = [
  { value: 'hono', label: 'Hono', disabled: false },
  { value: 'express', label: 'Express.js (Coming soon)', disabled: true },
  { value: 'fastify', label: 'Fastify (Coming soon)', disabled: true },
] as const;

// Runtime Options
export const RUNTIME_OPTIONS = [
  { value: 'nodejs', label: 'Node.js', disabled: false },
  { value: 'deno', label: 'Deno (Coming soon)', disabled: true },
  { value: 'bun', label: 'Bun (Coming soon)', disabled: true },
] as const;

// Deployment Target Options
export const DEPLOYMENT_OPTIONS = [
  { value: 'vercel', label: 'Vercel', disabled: false },
  { value: 'netlify', label: 'Netlify', disabled: false },
  { value: 'docker', label: 'Docker', disabled: false },
  { value: 'serverless', label: 'Serverless', disabled: false },
] as const;

// UI Text Constants
export const UI_TEXT = {
  // Page Title and Description
  PAGE_TITLE: 'Generate Hono Backend from API Specs',
  PAGE_DESCRIPTION: 'Upload or paste your API documentation and get a fully functional Node.js backend using the Hono framework in seconds.',
  
  // Section Titles
  API_SPECIFICATION: 'API Specification',
  CONFIGURATION: 'Configuration',
  GENERATED_BACKEND: 'Generated Backend',
  PROJECT_STRUCTURE: 'Project Structure',
  API_DOCUMENTATION: 'API Documentation',
  
  // Tab Labels
  PASTE_JSON: 'Paste JSON',
  UPLOAD_FILE: 'Upload File',
  IMPORT_URL: 'Import URL',
  CODE_PREVIEW: 'Code Preview',
  
  // Button Labels
  RESET: 'Reset',
  IMPORT: 'Import',
  GENERATE_BACKEND: 'Generate Backend',
  COPY_CODE: 'Copy Code',
  DOWNLOAD_ZIP: 'Download ZIP',
  VIEW_ON_GITHUB: 'View on GitHub',
  SHOW_CONSOLE: 'Show Console',
  BROWSE_FILES: 'Browse Files',
  
  // Form Labels
  FRAMEWORK: 'Framework',
  RUNTIME: 'Runtime',
  DEPLOYMENT_TARGET: 'Deployment Target',
  FEATURES: 'Features',
  TYPESCRIPT: 'TypeScript',
  INPUT_VALIDATION: 'Input Validation',
  DOCUMENTATION: 'Documentation',
  
  // Feature Descriptions
  TYPESCRIPT_DESC: 'Generate TypeScript code',
  INPUT_VALIDATION_DESC: 'Add request validation',
  DOCUMENTATION_DESC: 'Generate API docs',
  
  // Placeholders
  PASTE_JSON_PLACEHOLDER: 'Paste your JSON API specification here...',
  IMPORT_URL_PLACEHOLDER: 'https://example.com/api-spec.json',
  
  // File Upload
  DRAG_DROP_TEXT: 'or drag and drop',
  SUPPORTS_JSON: 'Supports JSON format',
  
  // Empty States
  SELECT_FILE_MESSAGE: 'Select a file to view its content.',
  GENERATE_BACKEND_MESSAGE: 'Generate a backend to see the project structure.',
  GENERATE_DOCS_MESSAGE: 'Generate a backend with documentation enabled to see API docs.',
  
  // File Tree
  FILES_LABEL: 'Files',
  
  // Documentation
  REQUEST_BODY_LABEL: 'Request Body:',
  RESPONSES_LABEL: 'Responses:',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_JSON: 'Error: Invalid API Specification. Please provide valid JSON.',
  INVALID_OPENAPI: 'Error: API Specification must be a valid OpenAPI v3.x structure.',
  PARSE_ERROR: 'Failed to parse API Spec as JSON',
  INVALID_STRUCTURE: 'Invalid OpenAPI structure in parsed spec.',
} as const;

// Generated Code Templates
export const CODE_TEMPLATES = {
  // Middleware Templates
  AUTH_MIDDLEWARE: (framework: string) => `// Authentication middleware placeholder for ${framework}`,
  VALIDATION_MIDDLEWARE: (framework: string) => `// Input validation middleware placeholder for ${framework}`,
  
  // Model Templates
  MODEL_HEADER: (schemaName: string) => `// Model for ${schemaName}`,
  INTERFACE_EXPORT: (schemaName: string) => `export interface ${schemaName} {`,
  JS_MODEL_COMMENT: (schemaName: string, properties: string[]) => 
    `// JavaScript model definition for ${schemaName}\n// Properties: ${properties.join(', ')}`,
  
  // Route Templates
  ROUTE_HEADER: (resourceName: string, pathKey: string) => 
    `// Routes for ${resourceName} - generated from ${pathKey}\nimport { Hono } from 'hono';`,
  CONTROLLER_HEADER: (resourceName: string) => `// Controllers for ${resourceName}`,
  SERVICE_HEADER: (resourceName: string) => `// Services for ${resourceName}`,
  
  // Main App Template
  MAIN_APP_HEADER: (framework: string, runtime: string) => 
    `// Main application entry point for ${framework} on ${runtime}\nimport { Hono } from 'hono';`,
  
  // Package.json
  PACKAGE_NAME_PREFIX: 'generated-',
  DEFAULT_BACKEND_NAME: 'backend',
  
  // README Template
  README_HEADER: (title: string) => `# ${title}`,
  README_GENERATED_BY: 'Generated by Backend Generator UI.',
  README_GETTING_STARTED: '## Getting Started\n...',
} as const;

// HTTP Method Colors for Documentation
export const HTTP_METHOD_COLORS = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700',
  OPTIONS: 'bg-gray-100 text-gray-700',
  HEAD: 'bg-gray-100 text-gray-700',
} as const;

// TypeScript Configuration
export const TYPESCRIPT_CONFIG = {
  compilerOptions: {
    target: 'es2020',
    module: 'commonjs',
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    strict: true,
    skipLibCheck: true,
    outDir: './dist',
  },
  include: ['src/**/*'],
  exclude: ['node_modules', '**/*.test.ts'],
} as const;

// Package Dependencies
export const DEPENDENCIES = {
  HONO: '^3.0.0',
  TYPESCRIPT: '^5.0.0',
  NODE_TYPES: '^20.0.0',
} as const;

// Script Commands
export const SCRIPTS = {
  HONO_DEV: 'hono dev',
  NODE_WATCH: 'node --watch',
  START: 'node dist/index.js',
  BUILD_TS: 'tsc',
  BUILD_JS: '# No build step for JS',
  TEST: 'jest',
} as const;

// File Extensions
export const FILE_EXTENSIONS = {
  TYPESCRIPT: 'ts',
  JAVASCRIPT: 'js',
} as const;

// Default Values
export const DEFAULTS = {
  VERSION: '1.0.0',
  API_STATUS: 'ok',
  API_MESSAGE: 'API is running',
  NOT_FOUND_MESSAGE: 'Not Found',
  NOT_FOUND_STATUS: 'error',
  DOCS_HTML: '<h1>API Documentation</h1><p>Generated documentation will appear here. (Details in Documentation tab)</p>',
} as const;