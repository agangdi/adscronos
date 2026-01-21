import { NextResponse } from 'next/server';
import { MCP_CONFIG } from '@/lib/mcp-config';

export async function GET() {
  const manifest = {
    name: 'X402 Premium Content',
    version: '1.0.0',
    description: 'Access premium content with ad-based X402 payments',
    resources: [
      {
        uri: 'ui://widget/mcp-widget.html',
        name: 'Premium Content Widget',
        mimeType: 'text/html+skybridge',
        description: 'Interactive widget for browsing and accessing premium content',
        _meta: {
          'openai/widgetPrefersBorder': true,
          'openai/widgetDomain': MCP_CONFIG.widget.domain,
          'openai/widgetCSP': {
            connect_domains: [MCP_CONFIG.widget.domain],
            resource_domains: ['https://*.oaistatic.com'],
          },
        },
      },
    ],
    tools: [
      {
        name: 'list_premium_resources',
        description: 'List all available premium resources',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/mcp-widget.html',
          'openai/toolInvocation/invoking': 'Loading premium resources...',
          'openai/toolInvocation/invoked': 'Resources loaded.',
        },
      },
      {
        name: 'access_premium_resource',
        description: 'Access a premium resource (may require watching an ad)',
        inputSchema: {
          type: 'object',
          properties: {
            resourceId: {
              type: 'string',
              description: 'ID of the resource to access',
            },
            userId: {
              type: 'string',
              description: 'User ID requesting access',
            },
          },
          required: ['resourceId', 'userId'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/mcp-widget.html',
          'openai/widgetAccessible': true,
          'openai/toolInvocation/invoking': 'Preparing resource access...',
          'openai/toolInvocation/invoked': 'Ready to view.',
        },
      },
      {
        name: 'complete_ad_and_pay',
        description: 'Complete ad viewing and process X402 payment',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Ad session ID',
            },
            resourceId: {
              type: 'string',
              description: 'Resource ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            paymentHeader: {
              type: 'string',
              description: 'Base64-encoded X402 payment header',
            },
          },
          required: ['sessionId', 'resourceId', 'userId', 'paymentHeader'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/mcp-widget.html',
          'openai/widgetAccessible': true,
          'openai/toolInvocation/invoking': 'Processing payment...',
          'openai/toolInvocation/invoked': 'Payment complete.',
        },
      },
    ],
  };

  return NextResponse.json(manifest);
}
