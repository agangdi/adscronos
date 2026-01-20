# X402 ChatGPT Widget

React-based widget UI for ChatGPT that handles ad viewing and X402 payment flow.

## Features

- **Resource Browsing** - Display premium content catalog
- **Ad Viewing** - Countdown timer for ad completion
- **Wallet Integration** - MetaMask and Web3 wallet support
- **Payment Signing** - EIP-3009 authorization generation
- **Content Display** - Show unlocked premium content
- **Dark/Light Theme** - Adapts to ChatGPT theme

## Build

```bash
npm install
npm run build
```

Output: `dist/widget.js` and `dist/widget.css`

## Components

### ResourceList

Displays grid of available premium resources with pricing.

### AdViewer

Shows advertisement iframe with countdown timer. Enables "Continue" button after ad completes.

### PaymentFlow

Handles:
1. Wallet connection
2. Network switching (Cronos testnet/mainnet)
3. EIP-3009 signature generation
4. Payment submission

### ContentViewer

Displays unlocked content with payment transaction details.

## Payment Flow

```javascript
// 1. Connect wallet
const provider = await connectWallet();

// 2. Switch to Cronos network
await switchToNetwork('cronos-testnet');

// 3. Generate payment header
const paymentHeader = await createPaymentHeader(
  paymentRequirements,
  provider
);

// 4. Submit to MCP server
await window.openai.callTool('complete_ad_and_pay', {
  sessionId,
  resourceId,
  userId,
  paymentHeader,
});
```

## window.openai API

The widget uses ChatGPT's widget runtime:

- `window.openai.toolOutput` - Data from MCP tool response
- `window.openai.toolResponseMetadata` - Additional metadata
- `window.openai.callTool()` - Invoke MCP tools
- `window.openai.theme` - Current theme (light/dark)

## Styling

CSS uses:
- Flexbox/Grid layouts
- Dark/Light theme variables
- Responsive design
- Smooth transitions

## Development

```bash
npm run dev
```

Opens Vite dev server at http://localhost:5173

## Testing

Test with MCP Inspector or integrate with MCP server.

## License

MIT
