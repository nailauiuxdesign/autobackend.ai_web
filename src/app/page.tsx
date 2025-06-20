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
import axios from 'axios';
import { marked } from 'marked';
// types.ts
export interface Endpoint {
  path: string;
  description: string;
  methods: Method[];
}

export interface Method {
  method: string; // e.g., "GET", "POST"
  summary: string;
  requestBody: RequestBody | null;
  responses: {
    [statusCode: string]: Response;
  };
}

export interface RequestBody {
  description: string;
  content: Record<string, string>; // e.g., { title: "string", content: "string" }
}

export interface Response {
  description: string;
  content: Record<string, string> | Record<string, string>[]; // could be object or array
}


export function parseDocumentation(jsonString: string): Endpoint[] {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) {
      throw new Error("Invalid format: expected an array");
    }
    return data as Endpoint[];
  } catch (error) {
    console.error("Failed to parse documentation:", error);
    return [];
  }
}


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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBackend = async () => {
    if (!apiSpec) {
      alert('Please provide an API specification');
      return;
    }

    setIsGenerating(true);
    setGeneratedBackend(null); // Clear previous results

    try {
      // Call the local API endpoint
      const response = await axios.post('http://localhost:3000/generate', apiSpec);

      // Process the response
      if (response.data.success) {
        console.log(response.data);
        const { metadata, files } = response.data;

        // Transform the files from the response into the FileSystemNode structure
        const newSampleFiles: FileSystemNode[] = [];

        // Process the files from the response
        for (const filePath of metadata.files) {
          const fileContent = files[filePath];
          const pathParts = filePath.split('/');

          // Find or create parent folders
          let currentLevel = newSampleFiles;
          let currentPath = '';

          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            let folder = currentLevel.find(node => node.name === part && node.type === 'folder');

            if (!folder) {
              folder = {
                id: currentPath,
                name: part,
                type: 'folder',
                children: []
              };
              currentLevel.push(folder);
            }

            currentLevel = folder.children || [];
          }

          // Add the file
          const fileName = pathParts[pathParts.length - 1];
          currentLevel.push({
            id: filePath,
            name: fileName,
            type: 'file',
            content: fileContent
          });
        }
        // console.log(response.data.files["parsedDocumentation.json"]);
        // const parsedString = response.data.files["parsedDocumentation.json"];

        // const endpoints = parseDocumentation(parsedString);

        setGeneratedBackend({
          files: newSampleFiles,
          documentation: response.data.files["documentation.md"]  || [], // Extract documentation from the API response
          documentationMarkdown: response.data.files["documentation.md"] // Extract markdown documentation
        });

        if (newSampleFiles.length > 0) {
          const findFirstFile = (nodes: FileSystemNode[]): FileSystemNode | null => {
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
      } else {
        alert('Failed to generate backend: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.log(error);
      console.error('Error generating backend:', error);
      alert('Error generating backend. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // The old implementation has been removed.
  // The new implementation now uses the /generate API endpoint via axios
  // and the response will set the generatedBackend state and handle file selection.

  // Remove auto-generation on mount to allow for proper demo
  // useEffect(() => {
  //   if (apiSpec) {
  //     handleGenerateBackend();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Run once on mount

  const handleFileSelect = (file: FileSystemNode) => {
    setSelectedFile(file);
  };

  const handleDownloadZip = async () => {
    if (!generatedBackend?.files || generatedBackend.files.length === 0) {
      alert('No backend files to download. Please generate a backend first.');
      return;
    }

    try {
      // Dynamically import JSZip with proper error handling for Next.js
      let JSZip;
      try {
        // Use dynamic import with explicit error handling
        const jsZipModule = await import('jszip');
        JSZip = jsZipModule.default;
        console.log('JSZip imported successfully:', !!JSZip);
      } catch (importError) {
        console.error('Failed to import JSZip:', importError);
        alert('Download functionality requires the JSZip package. Please ensure it is properly installed.');
        return;
      }

      const zip = new JSZip();
      console.log('Starting to add files to zip...');

      // Recursive function to add files to zip
      const addFilesToZip = (nodes: FileSystemNode[], currentPath = '') => {
        nodes.forEach(node => {
          const fullPath = currentPath
            ? `${currentPath}/${node.name}`
            : node.name;

          if (node.type === 'file' && node.content) {
            console.log('Adding file:', fullPath);
            zip.file(fullPath, node.content);
          } else if (node.type === 'folder' && node.children) {
            console.log('Processing folder:', fullPath);
            // Create folder and add its children
            addFilesToZip(node.children, fullPath);
          }
        });
      };

      // Add all files to zip
      console.log('Files to process:', generatedBackend.files.length);
      addFilesToZip(generatedBackend.files);
      console.log('Finished adding files, generating zip...');

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

      console.log('Download filename:', filename);
      link.download = filename;
      document.body.appendChild(link);
      console.log('Triggering download...');
      link.click();

      console.log('Download triggered successfully');
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
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  UI_TEXT.GENERATE_BACKEND
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Generating Your Backend...</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Please wait while we create your custom backend based on your API specification.
                This may take a few moments.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generated Backend Section - Conditionally Rendered */}
        {!isGenerating && generatedBackend && (
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
                  {
                    generatedBackend?.documentationMarkdown ? (
                      <div className="border p-3 rounded-md bg-background prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ 
                          __html: marked.parse(generatedBackend.documentationMarkdown) 
                        }} />
                      </div>
                    ) :
                    generatedBackend?.documentation &&
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
