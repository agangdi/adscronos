import 'dotenv/config';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ApiProcessor } from "./api-processor.js";

type ApiDataWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "assets");

function readWidgetHtml(componentName: string): string {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. Run "pnpm run build" before starting the server.`
    );
  }

  const directPath = path.join(ASSETS_DIR, `${componentName}.html`);
  let htmlContents: string | null = null;

  if (fs.existsSync(directPath)) {
    htmlContents = fs.readFileSync(directPath, "utf8");
  } else {
    const candidates = fs
      .readdirSync(ASSETS_DIR)
      .filter(
        (file) => file.startsWith(`${componentName}-`) && file.endsWith(".html")
      )
      .sort();
    const fallback = candidates[candidates.length - 1];
    if (fallback) {
      htmlContents = fs.readFileSync(path.join(ASSETS_DIR, fallback), "utf8");
    }
  }

  if (!htmlContents) {
    throw new Error(
      `Widget HTML for "${componentName}" not found in ${ASSETS_DIR}. Run "pnpm run build" to generate the assets.`
    );
  }

  return htmlContents;
}

function widgetDescriptorMeta(widget: ApiDataWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
  } as const;
}

function widgetInvocationMeta(widget: ApiDataWidget) {
  return {
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
  } as const;
}

const widgets: ApiDataWidget[] = [
  {
    id: "api-data-shop",
    title: "Open API Data Shop",
    templateUri: "ui://widget/api-data-carousel.html",
    invoking: "Opening the API data shop",
    invoked: "Shop opened",
    html: readWidgetHtml("api-data-carousel"),
    responseText: "Rendered the API Data shop!",
  },
  {
    id: "api-data-carousel",
    title: "Show API Data Carousel",
    templateUri: "ui://widget/api-data-carousel.html",
    invoking: "Loading API data carousel",
    invoked: "Carousel loaded",
    html: readWidgetHtml("api-data-carousel"),
    responseText: "Rendered the API Data carousel!",
  },
  {
    id: "check-balance",
    title: "Check Cronos Balance",
    templateUri: "ui://widget/api-data-carousel.html",
    invoking: "Checking Cronos balance",
    invoked: "Balance checked",
    html: readWidgetHtml("api-data-carousel"),
    responseText: "Check your Cronos wallet balance (0.1 TCRO per query)",
  },
  {
    id: "get-tcro",
    title: "Get Test TCRO",
    templateUri: "ui://widget/api-data-carousel.html",
    invoking: "Requesting test TCRO",
    invoked: "TCRO requested",
    html: readWidgetHtml("api-data-carousel"),
    responseText: "Get 0.1 TCRO from the faucet (Pay 0.1 TCRO)",
  },
];

const widgetsById = new Map<string, ApiDataWidget>();
const widgetsByUri = new Map<string, ApiDataWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

const toolInputSchema = {
  type: "object",
  properties: {
    dataType: {
      type: "string",
      description: "Type of API data to fetch.",
    },
  },
  required: ["dataType"],
  additionalProperties: false,
} as const;

const toolInputParser = z.object({
  dataType: z.string(),
});

const tools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetDescriptorMeta(widget),
  // To disable the approval prompt for the widgets
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
}));

const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

function createApiDataServer(): Server {
  const server = new Server(
    {
      name: "api-data-node",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    })
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widget = widgetsByUri.get(request.params.uri);

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: widgetDescriptorMeta(widget),
          },
        ],
      };
    }
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    })
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const widget = widgetsById.get(request.params.name);

      if (!widget) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const args = toolInputParser.parse(request.params.arguments ?? {});

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: {
          dataType: args.dataType,
        },
        _meta: widgetInvocationMeta(widget),
      };
    }
  );

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";
const apiProcessPath = "/api/process-query";
const adFetchPath = "/api/ads/fetch";
const adPlaybackPath = "/api/ads/playback";

// Initialize API processor
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || '';
const AD_API_BASE_URL = process.env.AD_API_BASE_URL || 'https://your-domain.com';
const AD_API_KEY = process.env.AD_API_KEY || '';

let apiProcessor: ApiProcessor | null = null;
if (OPENAI_API_KEY && WALLET_PRIVATE_KEY) {
  apiProcessor = new ApiProcessor(OPENAI_API_KEY, WALLET_PRIVATE_KEY);
  console.log('API Processor initialized');
} else {
  console.warn('Warning: OPENAI_API_KEY or WALLET_PRIVATE_KEY not set. API processing will be disabled.');
}

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  const server = createApiDataServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

async function handleApiProcessQuery(
  req: IncomingMessage,
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Content-Type", "application/json");

  if (!apiProcessor) {
    res.writeHead(500).end(JSON.stringify({
      success: false,
      message: 'API processor not initialized. Please set OPENAI_API_KEY and WALLET_PRIVATE_KEY environment variables.'
    }));
    return;
  }

  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { apiType, userInput } = JSON.parse(body);

        if (!apiType || !userInput) {
          res.writeHead(400).end(JSON.stringify({
            success: false,
            message: 'Missing required fields: apiType and userInput'
          }));
          return;
        }

        console.log(`Processing query - API Type: ${apiType}, Input: ${userInput}`);

        const result = await apiProcessor!.processQuery(apiType, userInput);

        res.writeHead(200).end(JSON.stringify(result));
      } catch (error: any) {
        console.error('Error processing query:', error);
        res.writeHead(500).end(JSON.stringify({
          success: false,
          message: `Error processing query: ${error.message}`
        }));
      }
    });
  } catch (error: any) {
    console.error('Error handling request:', error);
    res.writeHead(500).end(JSON.stringify({
      success: false,
      message: `Server error: ${error.message}`
    }));
  }
}

async function handleAdFetch(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Content-Type", "application/json");

  if (!AD_API_KEY) {
    res.writeHead(500).end(JSON.stringify({
      success: false,
      message: 'AD_API_KEY not configured'
    }));
    return;
  }

  try {
    const adType = url.searchParams.get('type') || 'IMAGE';
    const apiUrl = `${AD_API_BASE_URL}/api/public/ads?api_key=${AD_API_KEY}&type=${adType}`;
    
    console.log(`Fetching ad: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      res.writeHead(response.status).end(JSON.stringify(data));
      return;
    }
    
    res.writeHead(200).end(JSON.stringify(data));
  } catch (error: any) {
    console.error('Error fetching ad:', error);
    res.writeHead(500).end(JSON.stringify({
      success: false,
      message: `Error fetching ad: ${error.message}`
    }));
  }
}

async function handleAdPlayback(
  req: IncomingMessage,
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Content-Type", "application/json");

  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const playbackData = JSON.parse(body);
        const apiUrl = `${AD_API_BASE_URL}/api/public/ads/playback`;
        
        console.log(`Reporting ad playback: ${JSON.stringify(playbackData)}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(playbackData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          res.writeHead(response.status).end(JSON.stringify(data));
          return;
        }
        
        res.writeHead(200).end(JSON.stringify(data));
      } catch (error: any) {
        console.error('Error reporting playback:', error);
        res.writeHead(500).end(JSON.stringify({
          success: false,
          message: `Error reporting playback: ${error.message}`
        }));
      }
    });
  } catch (error: any) {
    console.error('Error handling playback request:', error);
    res.writeHead(500).end(JSON.stringify({
      success: false,
      message: `Server error: ${error.message}`
    }));
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (
      req.method === "OPTIONS" &&
      (url.pathname === ssePath || url.pathname === postPath || url.pathname === apiProcessPath || url.pathname === adFetchPath || url.pathname === adPlaybackPath)
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Private-Network": "true",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    if (req.method === "POST" && url.pathname === apiProcessPath) {
      await handleApiProcessQuery(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === adFetchPath) {
      await handleAdFetch(req, res, url);
      return;
    }

    if (req.method === "POST" && url.pathname === adPlaybackPath) {
      await handleAdPlayback(req, res);
      return;
    }

    res.writeHead(404).end("Not Found");
  }
);

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, () => {
  console.log(`API Data MCP server listening on http://localhost:${port}`);
  console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
  console.log(
    `  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`
  );
  console.log(
    `  API process endpoint: POST http://localhost:${port}${apiProcessPath}`
  );
  console.log(
    `  Ad fetch endpoint: GET http://localhost:${port}${adFetchPath}?type=VIDEO`
  );
  console.log(
    `  Ad playback endpoint: POST http://localhost:${port}${adPlaybackPath}`
  );
});
