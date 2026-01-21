# API Data Shop MCP server (Node)

This directory contains a Model Context Protocol (MCP) server implemented with the official TypeScript SDK. The server exposes the API Data Shop widget with intelligent API processing powered by OpenAI and blockchain integration via x402 payment protocol.

## Prerequisites

- Node.js 18+
- pnpm, npm, or yarn for dependency management
- OpenAI API key
- Cronos wallet with private key (for blockchain operations)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

If you prefer npm or yarn, adjust the command accordingly.

### 2. Configure environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `OPENAI_API_KEY`: Your OpenAI API key for intent recognition
- `WALLET_PRIVATE_KEY`: Your Cronos wallet private key (ensure it has some CRO for faucet operations)

### 3. Run the servers

**Option 1: Run all services together (recommended)**
```bash
pnpm run start:all
```

This starts:
- MCP Server (port 8000)
- Balance Service (port 3001)
- Faucet Service (port 3002)

**Option 2: Run services individually**
```bash
# Terminal 1: MCP Server
pnpm start

# Terminal 2: Balance Service
pnpm run start:balance

# Terminal 3: Faucet Service
pnpm run start:faucet
```

The MCP server bootstraps over SSE (Server-Sent Events), which makes it compatible with the MCP Inspector as well as ChatGPT connectors.

## Features

### MCP Widgets

The server exposes two interactive widgets:

1. **API Data Shop** - Browse and purchase API data products with ad playback
2. **API Data Carousel** - Horizontally scrollable showcase of API products

### API Processing Endpoint

**POST** `/api/process-query`

Processes user queries with OpenAI intent recognition and executes blockchain operations.

**Request Body:**
```json
{
  "apiType": "crypto-api",
  "userInput": "the CRO balance of 0x34Aa852F352D18423632CFF24695F5D349d0f53f"
}
```

**Response:**
```json
{
  "success": true,
  "intent": "balance_check",
  "address": "0x34Aa852F352D18423632CFF24695F5D349d0f53f",
  "result": "Balance of 0x34Aa852F352D18423632CFF24695F5D349d0f53f: 1.234 CRO"
}
```

### Supported Intents

1. **Balance Check** - Check CRO balance of any Cronos address
   - Example: "check balance of 0x..."
   - Uses ethers.js to query blockchain directly

2. **Faucet Request** - Request test tokens from faucet
   - Example: "send test tokens to 0x..."
   - Transfers 0.1 CRO from configured wallet

3. **Unknown Intent** - Returns "Coming soon" message
   - Any other type of request

### x402 Payment Integration

This project implements **both sides** of the x402 payment protocol:

**Buyer Side (MCP Server):**
- Generates EIP-3009 payment signatures
- Handles 402 Payment Required responses
- Settles payments via Cronos facilitator
- Purchases services from x402-protected endpoints

**Seller Side (Balance & Faucet Services):**
- Returns 402 Payment Required with payment requirements
- Verifies payment signatures via facilitator
- Settles payments on-chain
- Delivers protected content after payment confirmation

## Architecture

```
┌─────────────────┐
│   Carousel UI   │
└────────┬────────┘
         │ POST /api/process-query
         ▼
┌─────────────────────────────────────────────────────┐
│  MCP Server (x402 Buyer)                            │
│  - OpenAI Intent Recognition                        │
│  - x402 Payment Client                              │
│  - Purchases from protected services                │
└────────┬────────────────────────────────────────────┘
         │ x402 Payment Protocol
         ▼
┌─────────────────────────────────────────────────────┐
│  x402 Seller Services                               │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ Balance Service  │  │ Faucet Service   │        │
│  │ Port: 3001       │  │ Port: 3002       │        │
│  │ Price: 0.1 TCRO  │  │ Price: 0.1 TCRO  │        │
│  └──────────────────┘  └──────────────────┘        │
└────────┬────────────────────────────────────────────┘
         │
         ▼
   Cronos Facilitator ──► Cronos Testnet
```

## Endpoints

### MCP Server (Port 8000)
- **SSE stream**: `GET http://localhost:8000/mcp`
- **Message post**: `POST http://localhost:8000/mcp/messages?sessionId=...`
- **API process**: `POST http://localhost:8000/api/process-query`

### Balance Service (Port 3001) - x402 Seller
- **Endpoint**: `GET http://localhost:3001/api/balance?address=0x...`
- **Price**: 0.1 TCRO per query
- **Returns**: CRO balance of the address

### Faucet Service (Port 3002) - x402 Seller
- **Endpoint**: `GET http://localhost:3002/api/faucet?address=0x...`
- **Price**: 0.1 TCRO per request
- **Returns**: Sends 0.1 CRO to the address

## Development

### Testing the API endpoint

**Test MCP Server API (triggers x402 payment flow):**
```bash
curl -X POST http://localhost:8000/api/process-query \
  -H "Content-Type: application/json" \
  -d '{
    "apiType": "crypto-api",
    "userInput": "check balance of 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Test Balance Service directly (returns 402):**
```bash
curl -X GET "http://localhost:3001/api/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Test Faucet Service directly (returns 402):**
```bash
curl -X GET "http://localhost:3002/api/faucet?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### Adding new intents

Edit `src/api-processor.ts` and add your intent to the OpenAI system prompt and processing logic.

## Security Notes

- Never commit your `.env` file
- Keep your private keys secure
- Use testnet for development
- **Buyer wallet** needs TCRO balance to pay for services (0.1 TCRO per request)
- **Faucet wallet** needs CRO balance to distribute to users (0.1 CRO per request)
- **Seller wallet** receives TCRO payments from x402 transactions

## Troubleshooting

**"API processor not initialized"**
- Ensure `OPENAI_API_KEY` and `WALLET_PRIVATE_KEY` are set in `.env`

**"Insufficient funds in faucet wallet"**
- Add CRO to your faucet wallet address on Cronos testnet

**"Failed to connect to server"**
- Ensure all services are running (use `pnpm run start:all`)
- Check that ports 8000, 3001, 3002 are not in use
- Check CORS settings if accessing from different origin

**"Payment failed" or "Invalid payment"**
- Ensure buyer wallet has TCRO balance (at least 0.2 TCRO for testing)
- Check that SELLER_WALLET address is correct
- Verify network is set to 'cronos-testnet'

**"SELLER_WALLET environment variable is required"**
- Set SELLER_WALLET in your `.env` file
- This is the address that receives x402 payments

## x402 Payment Flow

1. **User submits query** → Carousel UI
2. **Ad plays for 10 seconds**
3. **MCP Server receives request** → Recognizes intent with OpenAI
4. **MCP Server requests service** → Balance/Faucet service (no payment)
5. **Service returns 402** → Payment requirements included
6. **MCP Server generates payment** → EIP-3009 signature
7. **MCP Server retries with payment** → X-PAYMENT header
8. **Service verifies payment** → Via Cronos facilitator
9. **Service settles payment** → On-chain transaction
10. **Service returns data** → Balance or faucet confirmation
11. **Result displayed to user** → In carousel modal
