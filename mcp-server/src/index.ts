import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from './config.js';
import { X402Client } from './x402-client.js';
import { ResourceService } from './resource-service.js';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

validateConfig();

const server = new Server(
  {
    name: 'x402-premium-content',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const x402Client = new X402Client();
const resourceService = new ResourceService();

let widgetHTML = '';
let widgetCSS = '';

try {
  const widgetPath = join(__dirname, '../../chatgpt-widget/dist/widget.js');
  const cssPath = join(__dirname, '../../chatgpt-widget/dist/widget.css');
  widgetHTML = readFileSync(widgetPath, 'utf8');
  widgetCSS = readFileSync(cssPath, 'utf8');
} catch (error) {
  console.warn('Widget files not found. Run `npm run build:widget` first.');
}

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'ui://widget/premium-content.html',
        name: 'Premium Content Widget',
        description: 'Interactive widget for viewing ads and accessing premium content',
        mimeType: 'text/html+skybridge',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'ui://widget/premium-content.html') {
    return {
      contents: [
        {
          uri: 'ui://widget/premium-content.html',
          mimeType: 'text/html+skybridge',
          text: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${widgetCSS}</style>
</head>
<body>
  <div id="widget-root"></div>
  <script type="module">${widgetHTML}</script>
</body>
</html>
          `.trim(),
          _meta: {
            'openai/widgetPrefersBorder': true,
            'openai/widgetDomain': config.widgetDomain,
            'openai/widgetCSP': {
              connect_domains: [config.apiBaseUrl, config.facilitatorUrl],
              resource_domains: ['https://*.oaistatic.com'],
            },
            'openai/widgetDescription': 'Shows premium content with ad-based payment flow',
          },
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${request.params.uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_premium_resources',
        description: 'List all available premium resources that can be accessed through ad viewing or payment',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/premium-content.html',
        },
      },
      {
        name: 'access_premium_resource',
        description: 'Access a premium resource. If payment is required, user will be shown an ad to watch.',
        inputSchema: {
          type: 'object',
          properties: {
            resourceId: {
              type: 'string',
              description: 'The ID of the premium resource to access',
            },
            userId: {
              type: 'string',
              description: 'User identifier for tracking',
            },
          },
          required: ['resourceId', 'userId'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/premium-content.html',
          'openai/widgetAccessible': true,
          'openai/toolInvocation/invoking': 'Checking access requirements...',
          'openai/toolInvocation/invoked': 'Resource ready',
        },
      },
      {
        name: 'complete_ad_and_pay',
        description: 'Complete ad viewing and process payment for premium resource (internal use)',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Ad session ID',
            },
            resourceId: {
              type: 'string',
              description: 'Resource ID to unlock',
            },
            userId: {
              type: 'string',
              description: 'User identifier',
            },
            paymentHeader: {
              type: 'string',
              description: 'Base64-encoded X402 payment header',
            },
          },
          required: ['sessionId', 'resourceId', 'userId', 'paymentHeader'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/premium-content.html',
          'openai/widgetAccessible': true,
          'openai/visibility': 'private',
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'list_premium_resources') {
    const resources = await resourceService.listPremiumResources();
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${resources.length} premium resources available.`,
        },
      ],
      structuredContent: {
        resources: resources.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          requiresPayment: r.requiresPayment,
          price: r.price,
        })),
      },
      _meta: {
        resources,
        action: 'list',
      },
    };
  }

  if (name === 'access_premium_resource') {
    const { resourceId, userId } = args as { resourceId: string; userId: string };
    
    const resource = await resourceService.getResourceById(resourceId);
    
    if (!resource) {
      return {
        content: [{ type: 'text', text: 'Resource not found.' }],
        structuredContent: { error: 'Resource not found' },
        _meta: { error: true },
      };
    }

    if (!resource.requiresPayment) {
      const content = await resourceService.accessPremiumContent(resourceId, userId);
      return {
        content: [
          {
            type: 'text',
            text: `Here's the content from "${resource.title}"`,
          },
        ],
        structuredContent: {
          resourceId,
          title: resource.title,
          hasAccess: true,
        },
        _meta: {
          resource,
          content: content?.content,
          action: 'access',
          requiresPayment: false,
        },
      };
    }

    const adSession = await resourceService.createAdSession(resourceId, userId);
    
    if (!adSession) {
      return {
        content: [{ type: 'text', text: 'Failed to create ad session.' }],
        structuredContent: { error: 'Failed to create ad session' },
        _meta: { error: true },
      };
    }

    const paymentRequirements = x402Client.createPaymentRequirements(
      resourceId,
      `Access to premium content: ${resource.title}`,
      resource.price
    );

    return {
      content: [
        {
          type: 'text',
          text: `To access "${resource.title}", please watch the ad shown in the widget.`,
        },
      ],
      structuredContent: {
        resourceId,
        title: resource.title,
        requiresAd: true,
        adDuration: adSession.duration,
      },
      _meta: {
        resource,
        adSession,
        paymentRequirements,
        action: 'show_ad',
        requiresPayment: true,
      },
    };
  }

  if (name === 'complete_ad_and_pay') {
    const { sessionId, resourceId, userId, paymentHeader } = args as {
      sessionId: string;
      resourceId: string;
      userId: string;
      paymentHeader: string;
    };

    const resource = await resourceService.getResourceById(resourceId);
    
    if (!resource) {
      return {
        content: [{ type: 'text', text: 'Resource not found.' }],
        structuredContent: { error: 'Resource not found' },
        _meta: { error: true },
      };
    }

    const paymentRequirements = x402Client.createPaymentRequirements(
      resourceId,
      `Access to premium content: ${resource.title}`,
      resource.price
    );

    const verifyResult = await x402Client.verifyPayment(paymentHeader, paymentRequirements);

    if (!verifyResult.isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Payment verification failed: ${verifyResult.invalidReason}`,
          },
        ],
        structuredContent: {
          error: 'Payment verification failed',
          reason: verifyResult.invalidReason,
        },
        _meta: { error: true },
      };
    }

    const settleResult = await x402Client.settlePayment(paymentHeader, paymentRequirements);

    if (settleResult.event !== 'payment.settled') {
      return {
        content: [
          {
            type: 'text',
            text: `Payment settlement failed: ${settleResult.error}`,
          },
        ],
        structuredContent: {
          error: 'Payment settlement failed',
          reason: settleResult.error,
        },
        _meta: { error: true },
      };
    }

    await resourceService.completeAdSession(sessionId, settleResult.txHash);

    const content = await resourceService.accessPremiumContent(
      resourceId,
      userId,
      settleResult.txHash
    );

    return {
      content: [
        {
          type: 'text',
          text: `Payment successful! Here's your premium content from "${resource.title}"`,
        },
      ],
      structuredContent: {
        resourceId,
        title: resource.title,
        paymentCompleted: true,
        txHash: settleResult.txHash,
      },
      _meta: {
        resource,
        content: content?.content,
        payment: {
          txHash: settleResult.txHash,
          from: settleResult.from,
          to: settleResult.to,
          value: settleResult.value,
          blockNumber: settleResult.blockNumber,
          timestamp: settleResult.timestamp,
        },
        action: 'payment_complete',
      },
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Store active SSE transports for session management
const sseTransports = new Map<string, SSEServerTransport>();

async function main() {
  const mode = process.env.MCP_MODE || 'stdio';

  if (mode === 'http') {
    const app = express();
    const httpServer = createServer(app);

    // CORS middleware - allow ChatGPT and iframe environments
    app.use(cors({
      origin: '*', // In production, restrict to specific domains
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }));

    // JSON body parser
    app.use(express.json({ limit: '10mb' }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'x402-mcp-server' });
    });

    // MCP SSE endpoint handler (shared by GET and POST)
    const handleMcpSseConnection = async (req: Request, res: Response) => {
      try {
        console.error(`[${req.method} /mcp] Establishing SSE connection`);
        
        // Create transport pointing to the messages endpoint
        const transport = new SSEServerTransport('/mcp/messages', res);
        const sessionId = transport.sessionId;
        
        console.error(`[${req.method} /mcp] Created session: ${sessionId}`);
        sseTransports.set(sessionId, transport);

        // Clean up on connection close
        transport.onclose = async () => {
          console.error(`[${req.method} /mcp] Connection closed for session ${sessionId}`);
          sseTransports.delete(sessionId);
        };

        transport.onerror = (error) => {
          console.error(`[${req.method} /mcp] Transport error for session ${sessionId}:`, error);
        };

        // Connect the server to the transport (this will call start() automatically)
        await server.connect(transport);
        console.error(`[${req.method} /mcp] SSE connection established for session ${sessionId}`);
      } catch (error) {
        console.error(`[${req.method} /mcp] Error establishing SSE connection:`, error);
        if (!res.headersSent) {
          res.status(500).end('Failed to establish SSE connection');
        }
      }
    };

    // Primary MCP endpoint - support both GET and POST
    app.get('/mcp', handleMcpSseConnection);
    // app.post('/mcp', handleMcpSseConnection);

    // POST /mcp/messages - Handle JSON-RPC messages
    app.post('/mcp/messages', async (req: Request, res: Response) => {
      try {
        const sessionId = req.query.sessionId as string;
        console.error(`[POST /mcp/messages] Received message for session ${sessionId}`);

        if (!sessionId) {
          return res.status(400).json({ error: 'Missing sessionId query parameter' });
        }

        const transport = sseTransports.get(sessionId);
        if (!transport) {
          console.error(`[POST /mcp/messages] Session not found: ${sessionId}`);
          return res.status(404).json({ error: 'Session not found or expired' });
        }

        // Let the transport handle the message
        await transport.handlePostMessage(req, res);
        console.error(`[POST /mcp/messages] Message processed for session ${sessionId}`);
      } catch (error) {
        console.error('[POST /mcp/messages] Error processing message:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to process message' });
        }
      }
    });

    // Legacy SSE endpoint (for backward compatibility / debugging)
    app.post('/sse', async (req: Request, res: Response) => {
      try {
        console.error('[/sse] New SSE connection');
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;
        const transport = new SSEServerTransport('/message', res);
        sseTransports.set(sessionId, transport);

        req.on('close', () => {
          console.error(`[/sse] Connection closed for session ${sessionId}`);
          sseTransports.delete(sessionId);
        });

        await server.connect(transport);
        console.error(`[/sse] Transport connected for session ${sessionId}`);
      } catch (error) {
        console.error('[/sse] Error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
      }
    });

    // Message endpoint for SSE transport (legacy)
    app.post('/message', async (req: Request, res: Response) => {
      try {
        const sessionId = req.headers['x-session-id'] as string;
        console.error(`[/message] Received message for session ${sessionId}:`, req.body);

        if (!sessionId) {
          return res.status(400).json({ error: 'Missing x-session-id header' });
        }

        const transport = sseTransports.get(sessionId);
        if (!transport) {
          return res.status(404).json({ error: 'Session not found or expired' });
        }

        // The transport should handle the message internally
        // For now, acknowledge receipt
        res.status(200).json({ received: true });
      } catch (error) {
        console.error('[/message] Error:', error);
        res.status(500).json({ error: 'Failed to process message' });
      }
    });

    httpServer.listen(config.port, config.host, () => {
      console.error(`X402 Premium Content MCP server running on http://${config.host}:${config.port}`);
      console.error(`Health check: http://${config.host}:${config.port}/health`);
      console.error(`MCP SSE endpoint: GET/POST http://${config.host}:${config.port}/mcp`);
      console.error(`MCP messages endpoint: POST http://${config.host}:${config.port}/mcp/messages?sessionId=xxx`);
      console.error(`Legacy SSE endpoint: http://${config.host}:${config.port}/sse`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('X402 Premium Content MCP server running on stdio');
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
