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
  const [runtime, setRuntime] = useState(DEFAULT_CONFIG.RUNTIME);
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

        let routeFileContent = `// Routes for ${resourceName} - generated from ${pathKey}\nimport { Hono } from 'hono';\n`;
        let controllerFileContent = `// Controllers for ${resourceName}\n`;
        let serviceFileContent = `// Services for ${resourceName}\n`;

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
            routeFileContent += `import { ${operationId}Controller } from '../controllers/${resourceName}.controller';\n`;
            controllerFileContent += `\nexport const ${operationId}Controller = async (c: any) => {\n  // TODO: Implement ${
              operation.summary || operationId
            }\n  // const data = await ${operationId}Service(c.req.param(), await c.req.json().catch(() => ({})));\n  return c.json({ message: '${
              operation.summary || operationId
            } placeholder' });\n};\n`;
            serviceFileContent += `\nexport const ${operationId}Service = async (params?: any, body?: any) => {\n  // TODO: Implement business logic for ${
              operation.summary || operationId
            }\n  console.log('Service called for ${operationId}', { params, body });
  return { data: 'service placeholder for ${operationId}' };\n};\n`;
          } else {
            // JS versions
            routeFileContent += `// const { ${operationId}Controller } = require('../controllers/${resourceName}.controller');\n`;
            controllerFileContent += `\nexports.${operationId}Controller = async (c) => {\n  // TODO: Implement ${
              operation.summary || operationId
            }\n  return c.json({ message: '${
              operation.summary || operationId
            } placeholder' });\n};\n`;
            serviceFileContent += `\nexports.${operationId}Service = async (params, body) => {\n  // TODO: Implement business logic for ${
              operation.summary || operationId
            }\n  return { data: 'service placeholder for ${operationId}' };\n};\n`;
          }
          // Simplified route registration for Hono
          routeFileContent += `\n// app.${method}('${pathKey}', ${operationId}Controller); // Example: app.get('/pets', listPetsController)
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
              '\n// You would typically initialize and export the router/app instance here or attach to a main app instance.',
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

    const srcFolderChildren: FileSystemNode[] = [
      {
        id: 'index.ts',
        name: `index.${typescript ? 'ts' : 'js'}`,
        type: 'file' as 'file',
        content: `// Main application entry point for ${framework} on ${runtime}\nimport { Hono } from 'hono';\n${
          typescript
            ? "import { logger } from 'hono/logger';"
            : "// const { logger } = require('hono/logger');"
        }\n${
          typescript
            ? "import { cors } from 'hono/cors';"
            : "// const { cors } = require('hono/cors');"
        }\n\n${
          typescript
            ? 'const app = new Hono();'
            : "const { Hono } = require('hono'); // Ensure Hono is available for JS\nconst app = new Hono();"
        }\n
// Middleware
app.use('*', logger());
app.use('*', cors());

// TODO: Import and use routes from ./routes folder
// Example: import petRoutes from './routes/pets.routes';
// app.route('/api/v1/pets', petRoutes);

${
  generateDocs
    ? '// Documentation endpoint (if enabled)\napp.get("/docs", (c) => c.html("<h1>API Documentation</h1><p>Generated documentation will appear here. (Details in Documentation tab)</p>"))\n'
    : ''
}

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'API is running',
    version: parsedSpec?.info?.version || '1.0.0',
    framework: '${framework}',
    runtime: '${runtime}',
  });
});

// Not found handler
app.notFound((c) => {
  return c.json({ status: 'error', message: 'Not Found'}, 404);
});

${typescript ? 'export default app;' : '// module.exports = app;'}`,
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

    // Add other standard files (package.json, README.md, tsconfig.json)
    newSampleFiles.push({
      id: 'package.json',
      name: 'package.json',
      type: 'file',
      content: JSON.stringify(
        {
          name: `generated-${framework}-${
            parsedSpec?.info?.title?.toLowerCase().replace(/\s+/g, '-') ||
            'backend'
          }`,
          version: parsedSpec?.info?.version || '1.0.0',
          main: `src/index.${typescript ? 'ts' : 'js'}`,
          scripts: {
            dev: `${
              framework === 'hono' ? 'hono dev' : 'node --watch'
            } src/index.${typescript ? 'ts' : 'js'}`,
            start: `node dist/index.js`,
            build: typescript ? 'tsc' : '# No build step for JS',
            test: 'jest', // Placeholder
          },
          dependencies: {
            hono: '^3.0.0', // Example, adjust based on framework
            ...(typescript && { typescript: '^5.0.0' }),
          },
          devDependencies: {
            ...(typescript && { '@types/node': '^20.0.0' }),
            // Add testing framework dev deps if needed
          },
        },
        null,
        2
      ),
    });
    newSampleFiles.push({
      id: 'README.md',
      name: 'README.md',
      type: 'file',
      content: `# ${
        parsedSpec?.info?.title || 'Generated Backend'
      }\n\nVersion: ${parsedSpec?.info?.version || '1.0.0'}\nDescription: ${
        parsedSpec?.info?.description || 'Generated by Backend Generator UI.'
      }\n\n- **Framework:** ${framework}\n- **Runtime:** ${runtime}\n- **TypeScript:** ${
        typescript ? 'Yes' : 'No'
      }\n\n## Getting Started\n...`,
    });
    if (typescript) {
      newSampleFiles.push({
        id: 'tsconfig.json',
        name: 'tsconfig.json',
        type: 'file' as 'file',
        content: JSON.stringify(
          {
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
          },
          null,
          2
        ),
      });
    }

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
