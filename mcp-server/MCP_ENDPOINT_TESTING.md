# MCP Endpoint Testing Guide

This document describes how to test the `/mcp` endpoint for ChatGPT Connector integration.

## Endpoint Overview

The MCP server now exposes a primary `/mcp` endpoint that supports:
- **JSON-RPC over HTTP**: Standard request/response mode
- **SSE Streaming**: Server-Sent Events for real-time updates
- **CORS enabled**: Works with ChatGPT and iframe environments

## Starting the Server

```bash
# Set environment variables
export MCP_MODE=http
export MCP_PORT=3001
export MCP_HOST=localhost

# Start the server
cd mcp-server
npm run build
node dist/index.js
```

Or use the `.env` file:
```bash
MCP_MODE=http
MCP_PORT=3001
MCP_HOST=localhost
```

## Testing with curl

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","service":"x402-mcp-server"}
```

### 2. Initialize MCP Connection
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

### 3. List Available Tools
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

Expected response includes:
- `list_premium_resources`
- `access_premium_resource`
- `complete_ad_and_pay`

### 4. List Available Resources (Widget)
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "resources/list",
    "params": {}
  }'
```

Expected response includes:
- `ui://widget/premium-content.html` with `mimeType: text/html+skybridge`

### 5. Read Widget Resource
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": {
      "uri": "ui://widget/premium-content.html"
    }
  }'
```

### 6. Call Tool - List Premium Resources
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "list_premium_resources",
      "arguments": {}
    }
  }'
```

### 7. Call Tool - Access Premium Resource
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "access_premium_resource",
      "arguments": {
        "resourceId": "resource_123",
        "userId": "test_user_001"
      }
    }
  }'
```

## Testing SSE Streaming

To test SSE mode, add the `Accept: text/event-stream` header:

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

## ChatGPT Connector Configuration

When configuring the connector in ChatGPT:

1. **MCP Server URL**: `https://your-domain.com/mcp` (or ngrok URL)
2. **Authentication**: None (or add API key if implemented)
3. **Protocol**: MCP over HTTP

### Using ngrok for Testing

```bash
# Start ngrok tunnel
ngrok http 3001

# Use the ngrok URL in ChatGPT Connector
# Example: https://abc123.ngrok.io/mcp
```

## Expected Behavior

### Successful Connection
- ChatGPT should be able to discover all 3 tools
- Widget should be available as a resource
- Tool calls should return proper responses with `structuredContent` and `_meta`

### Widget Rendering
- The widget should render in ChatGPT's iframe
- `mimeType: text/html+skybridge` ensures proper rendering
- Widget can access `window.openai` API for interactions

### Ad Flow
1. User requests premium content via `access_premium_resource`
2. If payment required, widget shows ad (`_meta.action: 'show_ad'`)
3. User watches ad, widget calls `complete_ad_and_pay`
4. Server processes payment and returns content (`_meta.action: 'payment_complete'`)

## Troubleshooting

### CORS Issues
- Check browser console for CORS errors
- Verify CORS middleware is enabled
- Ensure ngrok URL is used (not localhost) when testing from ChatGPT

### Connection Refused
- Verify server is running: `curl http://localhost:3001/health`
- Check firewall settings
- Ensure correct port in configuration

### Widget Not Rendering
- Verify `mimeType: text/html+skybridge` in resource response
- Check widget build: `npm run build:widget`
- Inspect widget HTML/CSS in response

### Tool Calls Failing
- Check server logs for errors
- Verify API endpoints are accessible: `curl http://localhost:3000/api/chatgpt/resources`
- Ensure database is running and migrated

## Logs and Debugging

Server logs include prefixes for easy filtering:
- `[/mcp]` - Main MCP endpoint logs
- `[/sse]` - Legacy SSE endpoint logs
- `[/message]` - Legacy message endpoint logs

Enable verbose logging:
```bash
export DEBUG=mcp:*
node dist/index.js
```

## Next Steps

1. Test with MCP Inspector: `npx @modelcontextprotocol/inspector`
2. Expose via ngrok: `ngrok http 3001`
3. Configure ChatGPT Connector with ngrok URL
4. Test complete ad viewing flow in ChatGPT
5. Monitor server logs for any issues

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/mcp` | POST | Primary MCP endpoint (JSON-RPC) |
| `/sse` | POST | Legacy SSE connection (debugging) |
| `/message` | POST | Legacy message handler (debugging) |

## Security Considerations

For production:
1. Restrict CORS origins to specific domains
2. Add authentication/API key validation
3. Implement rate limiting
4. Use HTTPS (required for ChatGPT)
5. Validate all input parameters
6. Add request logging and monitoring
