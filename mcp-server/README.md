# X402 MCP Server

MCP (Model Context Protocol) server for ChatGPT integration with X402 ad-based payment system.

## Features

- **Premium Content Access** - Serve paid content through ChatGPT
- **Ad-Based Monetization** - Users watch ads before payment
- **X402 Payment Integration** - Automated payment via Cronos blockchain
- **Visual Widget UI** - Interactive React components in ChatGPT
- **EIP-3009 Signatures** - Secure payment authorizations

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env with your settings

# Build widget
cd ../chatgpt-widget
npm install
npm run build

# Build and run server
cd ../mcp-server
npm run build
npm start
```

## Configuration

Required environment variables:

- `SELLER_WALLET` - Your Cronos wallet address (receives payments)
- `X402_NETWORK` - `cronos-testnet` or `cronos`
- `USDX_CONTRACT` - USDX token contract address
- `API_BASE_URL` - Your Next.js API base URL

## Tools

### list_premium_resources

Lists all available premium resources.

**Input:** None

**Output:**
```json
{
  "resources": [
    {
      "id": "res_123",
      "title": "Advanced AI Course",
      "description": "Learn AI techniques",
      "category": "AI & ML",
      "requiresPayment": true,
      "price": "1000000"
    }
  ]
}
```

### access_premium_resource

Initiates access to a premium resource. If payment is required, creates an ad session.

**Input:**
```json
{
  "resourceId": "res_123",
  "userId": "user_456"
}
```

**Output (Free Resource):**
```json
{
  "resourceId": "res_123",
  "title": "Free Tutorial",
  "hasAccess": true
}
```

**Output (Paid Resource):**
```json
{
  "resourceId": "res_123",
  "title": "Advanced AI Course",
  "requiresAd": true,
  "adDuration": 15
}
```

### complete_ad_and_pay

Completes ad viewing and processes payment.

**Input:**
```json
{
  "sessionId": "session_789",
  "resourceId": "res_123",
  "userId": "user_456",
  "paymentHeader": "base64EncodedPaymentHeader"
}
```

**Output:**
```json
{
  "resourceId": "res_123",
  "title": "Advanced AI Course",
  "paymentCompleted": true,
  "txHash": "0x..."
}
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Clean
npm run clean
```

## Testing

Use MCP Inspector to test locally:

```bash
npx @modelcontextprotocol/inspector http://localhost:3001/mcp
```

## Architecture

```
┌─────────────────┐
│   ChatGPT UI    │
└────────┬────────┘
         │ MCP Protocol
┌────────▼────────┐
│   MCP Server    │
│  - Tool Handlers│
│  - X402 Client  │
│  - Widget HTML  │
└────────┬────────┘
         │ HTTP API
┌────────▼────────┐
│  Next.js API    │
│  - Resources    │
│  - Ad Sessions  │
│  - Payments     │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│  - Resources    │
│  - Sessions     │
│  - Access Logs  │
└─────────────────┘
```

## License

MIT
