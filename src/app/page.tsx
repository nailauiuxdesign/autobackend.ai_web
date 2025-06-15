'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  UploadCloud,
  FileText,
  Settings2,
  Copy,
  Download,
  Github,
  Code,
  FolderTree,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
} from 'lucide-react';
import FileTree, { FileSystemNode } from '@/components/FileTree';
import {
  SAMPLE_API_SPEC_JSON,
  DEFAULT_CONFIG,
  FRAMEWORK_OPTIONS,
  RUNTIME_OPTIONS,
  DEPLOYMENT_OPTIONS,
  UI_TEXT,
  ERROR_MESSAGES,
  CODE_TEMPLATES,
  HTTP_METHOD_COLORS,
  TYPESCRIPT_CONFIG,
  DEPENDENCIES,
  SCRIPTS,
  FILE_EXTENSIONS,
  DEFAULTS,
} from '@/constants';

export default function Home() {
  const [framework, setFramework] = useState(DEFAULT_CONFIG.FRAMEWORK);
  const [runtime, setRuntime] = useState<'bun' | 'nodejs'>(
    DEFAULT_CONFIG.RUNTIME
  );
  const [deploymentTarget, setDeploymentTarget] = useState(
    DEFAULT_CONFIG.DEPLOYMENT_TARGET
  );
  const [typescript, setTypeScript] = useState(DEFAULT_CONFIG.TYPESCRIPT);
  const [inputValidation, setInputValidation] = useState(
    DEFAULT_CONFIG.INPUT_VALIDATION
  );
  const [generateDocs, setGenerateDocs] = useState(
    DEFAULT_CONFIG.GENERATE_DOCS
  );
  const [apiSpec, setApiSpec] = useState(SAMPLE_API_SPEC_JSON); // Prefill with sample JSON
  const [generatedBackend, setGeneratedBackend] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);

  const handleGenerateBackend = () => {
    console.log('Generating backend with:', {
      framework,
      runtime,
      deploymentTarget,
      typescript,
      inputValidation,
      generateDocs,
      // apiSpec - will be parsed below
    });

    let parsedSpec: any = null;
    try {
      parsedSpec = JSON.parse(apiSpec);
    } catch (jsonError) {
      console.error(ERROR_MESSAGES.PARSE_ERROR, jsonError);
      setGeneratedBackend({
        files: [],
        documentation: [],
        error: ERROR_MESSAGES.INVALID_JSON,
      });
      return;
    }

    if (
      !parsedSpec ||
      typeof parsedSpec !== 'object' ||
      !parsedSpec.paths ||
      !parsedSpec.components ||
      !parsedSpec.components.schemas
    ) {
      console.error(ERROR_MESSAGES.INVALID_STRUCTURE);
      setGeneratedBackend({
        files: [],
        documentation: [],
        error: ERROR_MESSAGES.INVALID_OPENAPI,
      });
      return;
    }

    const newSampleFiles: FileSystemNode[] = [];
    const routesFolder: FileSystemNode = {
      id: 'routes',
      name: 'routes',
      type: 'folder',
      children: [],
    };
    const controllersFolder: FileSystemNode = {
      id: 'controllers',
      name: 'controllers',
      type: 'folder',
      children: [],
    };
    const modelsFolder: FileSystemNode = {
      id: 'models',
      name: 'models',
      type: 'folder',
      children: [],
    };
    const servicesFolder: FileSystemNode = {
      id: 'services',
      name: 'services',
      type: 'folder',
      children: [],
    };
    const middlewareFolder: FileSystemNode = {
      id: 'middleware',
      name: 'middleware',
      type: 'folder',
      children: [
        {
          id: 'auth.middleware.ts',
          name: `auth.middleware.${typescript ? 'ts' : 'js'}`,
          type: 'file',
          content: `// Authentication middleware placeholder for ${framework}`,
        },
        {
          id: 'validation.middleware.ts',
          name: `validation.middleware.${typescript ? 'ts' : 'js'}`,
          type: 'file',
          content: `// Input validation middleware placeholder for ${framework}`,
        },
      ],
    };

    const generatedDocumentation: any[] = [];

    // Generate models from schemas
    if (parsedSpec.components.schemas) {
      for (const schemaName in parsedSpec.components.schemas) {
        const schema = parsedSpec.components.schemas[schemaName];
        let modelContent = `// Model for ${schemaName}\n`;
        if (typescript) {
          modelContent += `export interface ${schemaName} {\n`;
          if (schema.properties) {
            for (const propName in schema.properties) {
              const prop = schema.properties[propName];
              modelContent += `  ${propName}${
                schema.required && schema.required.includes(propName) ? '' : '?'
              }: ${prop.type === 'integer' ? 'number' : prop.type}; // ${
                prop.description || ''
              }\n`;
            }
          }
          modelContent += `}\n`;
        } else {
          modelContent += `// JavaScript model definition for ${schemaName}\n// Properties: ${Object.keys(
            schema.properties || {}
          ).join(', ')}\n`;
        }
        modelsFolder.children?.push({
          id: `${schemaName}.model`,
          name: `${schemaName}.model.${typescript ? 'ts' : 'js'}`,
          type: 'file',
          content: modelContent,
        });
      }
    }

    // Generate routes, controllers, services from paths
    if (parsedSpec.paths) {
      for (const pathKey in parsedSpec.paths) {
        const pathData = parsedSpec.paths[pathKey];
        const pathSegments = pathKey.replace(/^\/|\/$/g, '').split('/'); // /pets/{petId} -> ['pets', '{petId}']
        const resourceName = pathSegments[0] || 'general'; // 'pets'
        const capitalizedResourceName =
          resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

        let routeFileContent = '';
        let controllerFileContent = '';
        let serviceFileContent = '';

        if (typescript) {
          routeFileContent = `// Routes for ${resourceName} - generated from ${pathKey}
import { Hono } from 'hono';
import * as ${capitalizedResourceName}Controller from '../controllers/${resourceName}.controller';

const ${resourceName}Router = new Hono();

`;
          controllerFileContent = `import { Context } from 'hono';
import * as ${capitalizedResourceName}Service from '../services/${resourceName}.service';

// TODO: Add database imports if needed
// import { db } from '../database/connection';

`;
          serviceFileContent = `// TODO: Add database imports if needed
// import { db } from '../database/connection';

// ${capitalizedResourceName} Service Layer
// This service handles business logic for ${resourceName} operations

`;
        } else {
          routeFileContent = `// Routes for ${resourceName} - generated from ${pathKey}
const { Hono } = require('hono');
const ${capitalizedResourceName}Controller = require('../controllers/${resourceName}.controller');

const ${resourceName}Router = new Hono();

`;
          controllerFileContent = `const ${capitalizedResourceName}Service = require('../services/${resourceName}.service');

// TODO: Add database requires if needed
// const { db } = require('../database/connection');

`;
          serviceFileContent = `// TODO: Add database requires if needed
// const { db } = require('../database/connection');

// ${capitalizedResourceName} Service Layer
// This service handles business logic for ${resourceName} operations

`;
        }

        const docEntry: any = {
          path: pathKey,
          description: pathData.summary || `Endpoints for ${resourceName}`,
          methods: [],
        };

        for (const method in pathData) {
          const operation = pathData[method];
          const operationId =
            operation.operationId || `${method}${capitalizedResourceName}`;

          if (typescript) {
            controllerFileContent += `
export const ${operationId}Controller = async (c: Context) => {
  try {
    // Extract parameters and body
    const params = c.req.param();
    const body = method !== 'get' && method !== 'delete' ? await c.req.json().catch(() => ({})) : undefined;
    
    // Call service layer
    const result = await ${capitalizedResourceName}Service.${operationId}Service(params, body);
    
    // Return success response
    return c.json({
      success: true,
      data: result,
      message: '${operation.summary || operationId} completed successfully'
    }, 200);
  } catch (error) {
    console.error('Error in ${operationId}Controller:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to ${operation.summary?.toLowerCase() || operationId}'
    }, 500);
  }
};
`;
            serviceFileContent += `
export const ${operationId}Service = async (params?: any, body?: any) => {
  // TODO: Implement business logic for ${operation.summary || operationId}
  console.log('Service called for ${operationId}', { params, body });
  
  // Example implementation - replace with actual business logic
  try {
    // Add your database operations here
    // const result = await db.${resourceName}.${
              method === 'post'
                ? 'create'
                : method === 'get'
                ? 'findMany'
                : method === 'put'
                ? 'update'
                : 'delete'
            }(...);
    
    return {
      message: '${operation.summary || operationId} service executed',
      params,
      body,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Service error:', error);
    throw new Error('Service operation failed');
  }
};
`;
          } else {
            // JS versions
            controllerFileContent += `
exports.${operationId}Controller = async (c) => {
  try {
    const params = c.req.param();
    const body = '${method}' !== 'get' && '${method}' !== 'delete' ? await c.req.json().catch(() => ({})) : undefined;
    
    const result = await ${capitalizedResourceName}Service.${operationId}Service(params, body);
    
    return c.json({
      success: true,
      data: result,
      message: '${operation.summary || operationId} completed successfully'
    }, 200);
  } catch (error) {
    console.error('Error in ${operationId}Controller:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to ${operation.summary?.toLowerCase() || operationId}'
    }, 500);
  }
};
`;
            serviceFileContent += `
exports.${operationId}Service = async (params, body) => {
  console.log('Service called for ${operationId}', { params, body });
  
  try {
    return {
      message: '${operation.summary || operationId} service executed',
      params,
      body,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Service error:', error);
    throw new Error('Service operation failed');
  }
};
`;
          }
          // Add route registration
          routeFileContent += `${resourceName}Router.${method}('${pathKey.replace(
            '/' + resourceName,
            ''
          )}', ${capitalizedResourceName}Controller.${operationId}Controller);
`;

          docEntry.methods.push({
            method: method.toUpperCase(),
            summary: operation.summary || 'No summary',
            description: operation.description || '',
            requestBody: operation.requestBody
              ? {
                  description: operation.requestBody.description,
                  content: operation.requestBody.content,
                }
              : null,
            responses: operation.responses,
          });
        }
        generatedDocumentation.push(docEntry);

        if (
          !routesFolder.children?.find(
            f => f.name === `${resourceName}.routes.${typescript ? 'ts' : 'js'}`
          )
        ) {
          routesFolder.children?.push({
            id: `${resourceName}.routes`,
            name: `${resourceName}.routes.${typescript ? 'ts' : 'js'}`,
            type: 'file',
            content:
              routeFileContent +
              `\n// Export the router\n${
                typescript
                  ? `export default ${resourceName}Router;`
                  : `module.exports = ${resourceName}Router;`
              }`,
          });
        }
        if (
          !controllersFolder.children?.find(
            f =>
              f.name ===
              `${resourceName}.controller.${typescript ? 'ts' : 'js'}`
          )
        ) {
          controllersFolder.children?.push({
            id: `${resourceName}.controller`,
            name: `${resourceName}.controller.${typescript ? 'ts' : 'js'}`,
            type: 'file',
            content: controllerFileContent,
          });
        }
        if (
          !servicesFolder.children?.find(
            f =>
              f.name === `${resourceName}.service.${typescript ? 'ts' : 'js'}`
          )
        ) {
          servicesFolder.children?.push({
            id: `${resourceName}.service`,
            name: `${resourceName}.service.${typescript ? 'ts' : 'js'}`,
            type: 'file',
            content: serviceFileContent,
          });
        }
      }
    }

    // Generate route imports and registrations
    const routeImports = Object.keys(parsedSpec.paths || {})
      .map(path => {
        const resourceName = path.split('/')[1] || 'default';
        return typescript
          ? `import ${resourceName}Router from './routes/${resourceName}.routes';`
          : `const ${resourceName}Router = require('./routes/${resourceName}.routes');`;
      })
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .join('\n');

    const routeRegistrations = Object.keys(parsedSpec.paths || {})
      .map(path => {
        const resourceName = path.split('/')[1] || 'default';
        return `app.route('/api/${resourceName}', ${resourceName}Router);`;
      })
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .join('\n');

    const srcFolderChildren: FileSystemNode[] = [
      {
        id: 'index.ts',
        name: `index.${typescript ? 'ts' : 'js'}`,
        type: 'file' as 'file',
        content: typescript
          ? `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
${routeImports}

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'API is running', 
    timestamp: new Date().toISOString(),
    version: '${parsedSpec?.info?.version || '1.0.0'}',
    framework: '${framework}',
    runtime: '${runtime}',
    endpoints: {
      health: '/',
      docs: '/docs'
    }
  });
});

// API Routes
${routeRegistrations}

${
  generateDocs
    ? `// Documentation endpoint
app.get('/docs', (c) => {
  return c.html('<h1>API Documentation</h1><p>Generated documentation will appear here.</p>');
});`
    : ''
}

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error', message: 'Something went wrong' }, 500);
});

export default app;`
          : `const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { logger } = require('hono/logger');
${routeImports}

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'API is running', 
    timestamp: new Date().toISOString(),
    version: '${parsedSpec?.info?.version || '1.0.0'}',
    framework: '${framework}',
    runtime: '${runtime}',
    endpoints: {
      health: '/',
      docs: '/docs'
    }
  });
});

// API Routes
${routeRegistrations}

${
  generateDocs
    ? `// Documentation endpoint
app.get('/docs', (c) => {
  return c.html('<h1>API Documentation</h1><p>Generated documentation will appear here.</p>');
});`
    : ''
}

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error', message: 'Something went wrong' }, 500);
});

module.exports = app;`,
      },
    ];
    if (routesFolder.children && routesFolder.children.length > 0)
      srcFolderChildren.push(routesFolder);
    if (controllersFolder.children && controllersFolder.children.length > 0)
      srcFolderChildren.push(controllersFolder);
    if (modelsFolder.children && modelsFolder.children.length > 0)
      srcFolderChildren.push(modelsFolder);
    if (servicesFolder.children && servicesFolder.children.length > 0)
      srcFolderChildren.push(servicesFolder);
    if (middlewareFolder.children && middlewareFolder.children.length > 0)
      srcFolderChildren.push(middlewareFolder);

    newSampleFiles.push({
      id: 'src',
      name: 'src',
      type: 'folder',
      children: srcFolderChildren,
    });

    // Generate package.json
    const packageJson = {
      name:
        parsedSpec?.info?.title?.toLowerCase().replace(/\s+/g, '-') ||
        'generated-api',
      version: parsedSpec?.info?.version || '1.0.0',
      description:
        parsedSpec?.info?.description ||
        'Generated API backend using Hono framework',
      main: `src/index.${typescript ? 'ts' : 'js'}`,
      type: typescript ? undefined : 'commonjs',
      scripts: {
        start: typescript ? 'tsx src/index.ts' : 'node src/index.js',
        dev: typescript ? 'tsx watch src/index.ts' : 'nodemon src/index.js',
        build: typescript ? 'tsc' : 'echo "No build step for JavaScript"',
        test: 'echo "Error: no test specified" && exit 1',
        lint: typescript ? 'eslint src/**/*.ts' : 'eslint src/**/*.js',
        'type-check': typescript
          ? 'tsc --noEmit'
          : 'echo "No type checking for JavaScript"',
      },
      dependencies: {
        hono: '^4.0.0',
        ...(runtime === 'bun' ? {} : { '@hono/node-server': '^1.8.0' }),
        ...(typescript ? {} : { nodemon: '^3.0.0' }),
      },
      ...(typescript
        ? {
            devDependencies: {
              '@types/node': '^20.0.0',
              typescript: '^5.0.0',
              tsx: '^4.0.0',
              eslint: '^8.0.0',
              '@typescript-eslint/eslint-plugin': '^6.0.0',
              '@typescript-eslint/parser': '^6.0.0',
            },
          }
        : {
            devDependencies: {
              eslint: '^8.0.0',
            },
          }),
      engines: {
        node: '>=18.0.0',
        ...(runtime === 'bun' ? { bun: '>=1.0.0' } : {}),
      },
      keywords: [
        'api',
        'backend',
        'hono',
        framework.toLowerCase(),
        runtime.toLowerCase(),
        ...(typescript ? ['typescript'] : ['javascript']),
      ],
      author: '',
      license: 'MIT',
    };

    // Add other standard files (package.json, README.md, tsconfig.json)
    newSampleFiles.push({
      id: 'package.json',
      name: 'package.json',
      type: 'file',
      content: JSON.stringify(packageJson, null, 2),
    });
    newSampleFiles.push({
      id: 'README.md',
      name: 'README.md',
      type: 'file',
      content: `# ${parsedSpec?.info?.title || 'Generated API'}

${
  parsedSpec?.info?.description ||
  'A generated backend API using Hono framework'
}

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0${runtime === 'bun' ? '\n- Bun >= 1.0.0' : ''}
- npm or yarn or pnpm${runtime === 'bun' ? ' or bun' : ''}

### Installation

1. Install dependencies:
   \`\`\`bash
   ${runtime === 'bun' ? 'bun install' : 'npm install'}
   \`\`\`

2. Start the development server:
   \`\`\`bash
   ${runtime === 'bun' ? 'bun run dev' : 'npm run dev'}
   \`\`\`

3. The API will be available at \`http://localhost:3000\`

### Available Scripts

- \`${
        runtime === 'bun' ? 'bun run dev' : 'npm run dev'
      }\` - Start development server with hot reload
- \`${
        runtime === 'bun' ? 'bun run start' : 'npm start'
      }\` - Start production server
- \`${runtime === 'bun' ? 'bun run build' : 'npm run build'}\` - ${
        typescript ? 'Build TypeScript to JavaScript' : 'No build step required'
      }
- \`${runtime === 'bun' ? 'bun run test' : 'npm test'}\` - Run tests
- \`${runtime === 'bun' ? 'bun run lint' : 'npm run lint'}\` - Run ESLint
${
  typescript
    ? `- \`${
        runtime === 'bun' ? 'bun run type-check' : 'npm run type-check'
      }\` - Run TypeScript type checking`
    : ''
}

## 📁 Project Structure

\`\`\`
${
  parsedSpec?.info?.title?.toLowerCase().replace(/\s+/g, '-') || 'generated-api'
}/
├── src/
│   ├── index.${typescript ? 'ts' : 'js'}          # Application entry point
│   ├── routes/           # API route definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # Data models${
        typescript ? ' (TypeScript interfaces)' : ''
      }
│   └── middleware/       # Custom middleware
├── package.json
├── README.md
${typescript ? '├── tsconfig.json         # TypeScript configuration' : ''}
└── .gitignore
\`\`\`

## 🛠 Technology Stack

- **Framework**: ${framework}
- **Runtime**: ${runtime}
- **Language**: ${typescript ? 'TypeScript' : 'JavaScript'}
- **Web Framework**: Hono
- **API Specification**: OpenAPI 3.0

## 📖 API Documentation

${
  generateDocs
    ? 'Visit `/docs` endpoint for interactive API documentation.'
    : 'API documentation can be generated based on the OpenAPI specification.'
}

### Health Check

\`\`\`bash
curl http://localhost:3000/
\`\`\`

### Available Endpoints

${Object.keys(parsedSpec?.paths || {})
  .map(path => {
    const methods = Object.keys(parsedSpec.paths[path] || {});
    return `- \`${methods.map(m => m.toUpperCase()).join(', ')} ${path}\``;
  })
  .join('\n')}

## 🔧 Configuration

### Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (if applicable)
# DATABASE_URL=your_database_url

# API Configuration
API_VERSION=${parsedSpec?.info?.version || '1.0.0'}
\`\`\`

## 🚀 Deployment

### Using Node.js

1. Build the application (if TypeScript):
   \`\`\`bash
   ${runtime === 'bun' ? 'bun run build' : 'npm run build'}
   \`\`\`

2. Start the production server:
   \`\`\`bash
   ${runtime === 'bun' ? 'bun start' : 'npm start'}
   \`\`\`

### Using Docker

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
${typescript ? 'RUN npm run build' : ''}
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

*Generated by AutoBackend.ai*
`,
    });
    if (typescript) {
      newSampleFiles.push({
        id: 'tsconfig.json',
        name: 'tsconfig.json',
        type: 'file' as 'file',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'ESNext',
              moduleResolution: 'node',
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              strict: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              outDir: './dist',
              rootDir: './src',
              declaration: true,
              declarationMap: true,
              sourceMap: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmitOnError: true,
              incremental: true,
              tsBuildInfoFile: './dist/.tsbuildinfo',
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
            ts_node: {
              esm: true,
            },
          },
          null,
          2
        ),
      });
    }

    // Add .gitignore
    newSampleFiles.push({
      id: 'gitignore',
      name: '.gitignore',
      type: 'file',
      content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Rollup.js default build output
dist/

# Uncomment the public line in if your project uses Gatsby and not Next.js
# public

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`,
    });

    // Add .env.example
    newSampleFiles.push({
      id: 'env-example',
      name: '.env.example',
      type: 'file',
      content: `# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_VERSION=${parsedSpec?.info?.version || '1.0.0'}
API_TITLE=${parsedSpec?.info?.title || 'Generated API'}

# Database Configuration (uncomment and configure as needed)
# DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# MONGODB_URI=mongodb://localhost:27017/database_name
# REDIS_URL=redis://localhost:6379

# Authentication (if applicable)
# JWT_SECRET=your-super-secret-jwt-key
# JWT_EXPIRES_IN=7d

# External APIs (if applicable)
# EXTERNAL_API_KEY=your-api-key
# EXTERNAL_API_URL=https://api.example.com

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`,
    });

    setGeneratedBackend({
      files: newSampleFiles,
      documentation: generateDocs ? generatedDocumentation : [],
    });

    if (newSampleFiles.length > 0) {
      const findFirstFile = (
        nodes: FileSystemNode[]
      ): FileSystemNode | null => {
        for (const node of nodes) {
          if (node.type === 'file') return node;
          if (node.children) {
            const found = findFirstFile(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      setSelectedFile(findFirstFile(newSampleFiles));
    }
  };

  // useEffect to call handleGenerateBackend on mount if apiSpec is prefilled
  useEffect(() => {
    if (apiSpec) {
      handleGenerateBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleFileSelect = (file: FileSystemNode) => {
    setSelectedFile(file);
  };

  const handleDownloadZip = async () => {
    if (!generatedBackend?.files || generatedBackend.files.length === 0) {
      alert('No backend files to download. Please generate a backend first.');
      return;
    }

    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Recursive function to add files to zip
      const addFilesToZip = (nodes: FileSystemNode[], currentPath = '') => {
        nodes.forEach(node => {
          const fullPath = currentPath
            ? `${currentPath}/${node.name}`
            : node.name;

          if (node.type === 'file' && node.content) {
            zip.file(fullPath, node.content);
          } else if (node.type === 'folder' && node.children) {
            // Create folder and add its children
            addFilesToZip(node.children, fullPath);
          }
        });
      };

      // Add all files to zip
      addFilesToZip(generatedBackend.files);

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename based on API spec title or use default
      let filename = 'generated-backend.zip';
      try {
        const parsedSpec = JSON.parse(apiSpec);
        if (parsedSpec?.info?.title) {
          const sanitizedTitle = parsedSpec.info.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          filename = `${sanitizedTitle}-backend.zip`;
        }
      } catch (e) {
        // Use default filename if parsing fails
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
            {UI_TEXT.PAGE_TITLE}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground sm:mt-5 sm:text-xl">
            {UI_TEXT.PAGE_DESCRIPTION}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* API Specification Section (takes 2/3 width on lg screens) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{UI_TEXT.API_SPECIFICATION}</CardTitle>
              <div className="flex items-center gap-2">
                {/* <Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" />Save</Button> */}
                <Button variant="ghost" size="sm">
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="paste" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="paste">{UI_TEXT.PASTE_JSON}</TabsTrigger>
                  <TabsTrigger value="upload">
                    {UI_TEXT.UPLOAD_FILE}
                  </TabsTrigger>
                  <TabsTrigger value="import">{UI_TEXT.IMPORT_URL}</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 dark:border-gray-100/25 px-6 py-10 min-h-[200px] items-center">
                    <div className="text-center">
                      <UploadCloud
                        className="mx-auto h-12 w-12 text-gray-400"
                        aria-hidden="true"
                      />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-300">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white dark:bg-gray-900 font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 hover:text-primary/80"
                        >
                          <span>Browse Files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Supports JSON format
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="paste">
                  <textarea
                    rows={10}
                    className="block w-full rounded-md border-0 py-1.5 text-black shadow-sm ring-1 ring-inset ring-gray-300 px-2 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                    placeholder={UI_TEXT.PASTE_JSON_PLACEHOLDER}
                    value={apiSpec}
                    onChange={e => setApiSpec(e.target.value)}
                  />
                </TabsContent>
                <TabsContent value="import">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/api-spec.json"
                      className="flex-grow"
                    />
                    <Button>Import</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Configuration Section (takes 1/3 width on lg screens) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{UI_TEXT.CONFIGURATION}</CardTitle>
              <Button variant="ghost" size="sm">
                Reset
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="framework">{UI_TEXT.FRAMEWORK}</Label>
                <Select value={framework} onValueChange={setFramework as any}>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {FRAMEWORK_OPTIONS.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="runtime">{UI_TEXT.RUNTIME}</Label>
                <Select value={runtime} onValueChange={setRuntime as any}>
                  <SelectTrigger id="runtime">
                    <SelectValue placeholder="Select runtime" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {RUNTIME_OPTIONS.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="deployment">Deployment Target</Label>
                <Select value={deploymentTarget} onValueChange={setDeploymentTarget}>
                  <SelectTrigger id="deployment">
                    <SelectValue placeholder="Select deployment target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vercel">Vercel</SelectItem>
                    <SelectItem value="netlify">Netlify</SelectItem>
                    <SelectItem value="docker">Docker</SelectItem>
                    <SelectItem value="serverless">Serverless</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              <div>
                <h4 className="text-sm font-medium mb-2">{UI_TEXT.FEATURES}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="typescript"
                      className="flex flex-col space-y-1"
                    >
                      <span>{UI_TEXT.TYPESCRIPT}</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        {UI_TEXT.TYPESCRIPT_DESC}
                      </span>
                    </Label>
                    <Switch
                      id="typescript"
                      checked={typescript}
                      onCheckedChange={setTypeScript as any}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="inputValidation"
                      className="flex flex-col space-y-1"
                    >
                      <span>{UI_TEXT.INPUT_VALIDATION}</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        {UI_TEXT.INPUT_VALIDATION_DESC}
                      </span>
                    </Label>
                    <Switch
                      id="inputValidation"
                      checked={inputValidation}
                      onCheckedChange={setInputValidation as any}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="generateDocs"
                      className="flex flex-col space-y-1"
                    >
                      <span>{UI_TEXT.DOCUMENTATION}</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        {UI_TEXT.DOCUMENTATION_DESC}
                      </span>
                    </Label>
                    <Switch
                      id="generateDocs"
                      checked={generateDocs}
                      onCheckedChange={setGenerateDocs as any}
                    />
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                onClick={handleGenerateBackend}
              >
                {UI_TEXT.GENERATE_BACKEND}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Backend Section - Conditionally Rendered */}
        {generatedBackend && (
          <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Code className="mr-2 h-5 w-5" />
                <CardTitle>{UI_TEXT.GENERATED_BACKEND}</CardTitle>
              </div>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Show Console
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="code-preview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="code-preview">
                    <Code className="mr-2 h-4 w-4" />
                    {UI_TEXT.CODE_PREVIEW}
                  </TabsTrigger>
                  <TabsTrigger value="project-structure">
                    <FolderTree className="mr-2 h-4 w-4" />
                    {UI_TEXT.PROJECT_STRUCTURE}
                  </TabsTrigger>
                  <TabsTrigger value="documentation">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {UI_TEXT.API_DOCUMENTATION}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="code-preview">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
                    {/* Left Column: File Tree */}
                    <div className="md:col-span-1 border rounded-md p-4 bg-muted/20">
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                        Files
                      </h3>
                      <FileTree
                        nodes={generatedBackend.files}
                        onFileSelect={handleFileSelect}
                        selectedFileId={selectedFile?.id}
                      />
                    </div>

                    {/* Right Column: Code Editor / Viewer */}
                    <div className="md:col-span-2 border rounded-md p-4 relative">
                      {selectedFile && selectedFile.type === 'file' ? (
                        <>
                          <div className="flex justify-between items-center mb-2 pb-2 border-b">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <FileText
                                size={16}
                                className="mr-2 flex-shrink-0"
                              />
                              <span>{selectedFile.id}</span>{' '}
                              {/* Displaying ID as path for now */}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Copy size={16} />
                            </Button>
                          </div>
                          <pre className="text-sm whitespace-pre-wrap overflow-auto h-[calc(400px-80px)]">
                            {' '}
                            {/* Adjust height as needed */}
                            {selectedFile.content}
                          </pre>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Select a file to view its content.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent
                  value="project-structure"
                  className="p-4 border rounded-md bg-muted/20 min-h-[300px]"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    Project Structure
                  </h3>
                  {generatedBackend?.files &&
                  generatedBackend.files.length > 0 ? (
                    <div className="bg-background border rounded-md p-3 max-h-[400px] overflow-auto">
                      <FileTree
                        nodes={generatedBackend.files}
                        onFileSelect={handleFileSelect}
                        selectedFileId={selectedFile?.id}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Generate a backend to see the project structure.
                    </p>
                  )}
                </TabsContent>
                <TabsContent
                  value="documentation"
                  className="p-4 border rounded-md bg-muted/20 min-h-[300px]"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    API Documentation
                  </h3>
                  {generatedBackend?.documentation &&
                  generatedBackend.documentation.length > 0 ? (
                    <div className="space-y-4">
                      {generatedBackend.documentation.map(
                        (endpoint: any, index: number) => (
                          <div
                            key={index}
                            className="border p-3 rounded-md bg-background"
                          >
                            <h4 className="font-semibold text-md">
                              {endpoint.path}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-1">
                              {endpoint.description}
                            </p>
                            {endpoint.methods.map(
                              (method: any, mIndex: number) => (
                                <div
                                  key={mIndex}
                                  className="ml-2 mt-1 border-l-2 pl-2 border-blue-500"
                                >
                                  <span
                                    className={
                                      HTTP_METHOD_COLORS[
                                        method.method as keyof typeof HTTP_METHOD_COLORS
                                      ] || 'bg-gray-100 text-gray-700'
                                    }
                                  >
                                    {method.method}
                                  </span>
                                  <span className="ml-2 text-sm">
                                    {method.summary}
                                  </span>
                                  {method.requestBody && (
                                    <div className="mt-1 pl-2 text-xs">
                                      <strong>
                                        {UI_TEXT.REQUEST_BODY_LABEL}
                                      </strong>{' '}
                                      {method.requestBody.description}
                                      {method.requestBody.content && (
                                        <pre className="mt-1 p-1 bg-muted/50 rounded text-xs overflow-auto">
                                          {JSON.stringify(
                                            method.requestBody.content,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      )}
                                    </div>
                                  )}
                                  {method.responses && (
                                    <div className="mt-1 pl-2 text-xs">
                                      <strong>{UI_TEXT.RESPONSES_LABEL}</strong>
                                      {Object.entries(method.responses).map(
                                        ([status, resp]: [string, any]) => (
                                          <div key={status} className="mt-0.5">
                                            <span className="font-medium">
                                              {status}:
                                            </span>{' '}
                                            {resp.description}
                                            {resp.content && (
                                              <pre className="mt-1 p-1 bg-muted/50 rounded text-xs overflow-auto">
                                                {JSON.stringify(
                                                  resp.content,
                                                  null,
                                                  2
                                                )}
                                              </pre>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {UI_TEXT.GENERATE_DOCS_MESSAGE}
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4 mt-4">
              <div>
                <Button variant="outline" size="sm" className="mr-2">
                  <Copy className="mr-2 h-4 w-4" /> {UI_TEXT.COPY_CODE}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                  onClick={handleDownloadZip}
                >
                  <Download className="mr-2 h-4 w-4" /> {UI_TEXT.DOWNLOAD_ZIP}
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Github className="mr-2 h-4 w-4" /> {UI_TEXT.VIEW_ON_GITHUB}
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
