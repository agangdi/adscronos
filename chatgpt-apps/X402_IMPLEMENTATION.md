# x402 Payment Protocol Implementation

This document describes the complete x402 payment protocol implementation in the API Data Shop project.

## Overview

We have implemented **both buyer and seller sides** of the x402 payment protocol:

- **Buyer**: MCP Server acts as a buyer, purchasing blockchain services
- **Sellers**: Balance Service and Faucet Service act as sellers, providing paid services

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                      (API Data Carousel)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 1. User Query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server (Port 8000)                       │
│                      x402 BUYER SIDE                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Receive user query                                    │  │
│  │ 2. OpenAI intent recognition                             │  │
│  │ 3. Request service (no payment)                          │  │
│  │ 4. Receive 402 Payment Required                          │  │
│  │ 5. Generate EIP-3009 signature                           │  │
│  │ 6. Retry with X-PAYMENT header                           │  │
│  │ 7. Return result to user                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ x402 Payment Protocol
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    x402 SELLER SERVICES                         │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │  Balance Service     │      │   Faucet Service     │        │
│  │    (Port 3001)       │      │    (Port 3002)       │        │
│  │                      │      │                      │        │
│  │  Price: 1 USDX       │      │  Price: 0.5 USDX     │        │
│  │  Returns: CRO balance│      │  Returns: 0.1 CRO    │        │
│  │                      │      │                      │        │
│  │  Steps:              │      │  Steps:              │        │
│  │  1. Return 402       │      │  1. Return 402       │        │
│  │  2. Verify payment   │      │  2. Verify payment   │        │
│  │  3. Settle payment   │      │  3. Settle payment   │        │
│  │  4. Return data      │      │  4. Transfer CRO     │        │
│  └──────────────────────┘      └──────────────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Verify & Settle
                             ▼
                  ┌──────────────────────┐
                  │ Cronos Facilitator   │
                  │ (cronoslabs.org)     │
                  └──────────┬───────────┘
                             │
                             │ On-chain Settlement
                             ▼
                  ┌──────────────────────┐
                  │  Cronos Testnet      │
                  │  USDX Token Contract │
                  └──────────────────────┘
```

## Implementation Files

### Buyer Side (x402 Client)

**File**: `server_node/src/x402-client.ts`

Key functions:
- `generateNonce()` - Generates random 32-byte nonce
- `createPaymentHeader()` - Creates EIP-3009 signed payment authorization
- `payForResource()` - Complete payment flow (402 → sign → retry)
- `createWallet()` - Initialize wallet with provider
- `getBalance()` - Query blockchain balance

### Seller Side Services

**File**: `server_node/src/balance-service.ts`
- Returns 402 with payment requirements
- Verifies payment via facilitator `/verify` endpoint
- Settles payment via facilitator `/settle` endpoint
- Returns CRO balance after successful payment

**File**: `server_node/src/faucet-service.ts`
- Returns 402 with payment requirements
- Verifies and settles payment
- Transfers 0.1 CRO to requested address
- Returns transaction hash

### Integration Layer

**File**: `server_node/src/api-processor.ts`
- OpenAI intent recognition
- Calls x402-protected services via `payForResource()`
- Handles balance checks and faucet requests

**File**: `server_node/src/server.ts`
- MCP server with `/api/process-query` endpoint
- Integrates ApiProcessor for query handling

## Payment Flow Details

### Step-by-Step Flow

1. **User Action**
   - User clicks "Purchase" on API card
   - Enters query (e.g., "check balance of 0x...")
   - Watches 10-second ad

2. **MCP Server Processing**
   ```
   POST /api/process-query
   {
     "apiType": "crypto-api",
     "userInput": "check balance of 0x..."
   }
   ```

3. **OpenAI Intent Recognition**
   - GPT-4 analyzes query
   - Identifies intent: `balance_check` or `faucet_request`
   - Extracts Cronos address

4. **First Request (No Payment)**
   ```
   GET http://localhost:3001/api/balance?address=0x...
   ```

5. **Seller Returns 402**
   ```json
   {
     "error": "Payment Required",
     "x402Version": 1,
     "paymentRequirements": {
       "scheme": "exact",
       "network": "cronos-testnet",
       "payTo": "0xSELLER_ADDRESS",
       "asset": "0x0000000000000000000000000000000000000000",
       "maxAmountRequired": "100000000000000000",
       "maxTimeoutSeconds": 300
     }
   }
   ```

6. **Buyer Generates Payment**
   - Creates transaction authorization for native TCRO
   - Signs with buyer's private key
   - Constructs payment header (base64 JSON)

7. **Retry with Payment**
   ```
   GET http://localhost:3001/api/balance?address=0x...
   Headers: X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MS4uLn0=
   ```

8. **Seller Verifies Payment**
   ```
   POST https://facilitator.cronoslabs.org/v2/x402/verify
   {
     "x402Version": 1,
     "paymentHeader": "...",
     "paymentRequirements": {...}
   }
   ```

9. **Seller Settles Payment**
   ```
   POST https://facilitator.cronoslabs.org/v2/x402/settle
   ```
   - Facilitator executes on-chain transfer
   - TCRO moves from buyer to seller

10. **Seller Returns Data**
    ```json
    {
      "success": true,
      "address": "0x...",
      "balance": "1.234",
      "unit": "CRO",
      "payment": {
        "txHash": "0x...",
        "blockNumber": 12345
      }
    }
    ```

11. **Result Displayed**
    - MCP server returns to carousel
    - User sees result in modal

## Configuration

### Environment Variables

```bash
# Buyer Configuration
OPENAI_API_KEY=sk-...                    # For intent recognition
WALLET_PRIVATE_KEY=0x...                 # Buyer wallet (needs TCRO)

# Seller Configuration
SELLER_WALLET=0x...                      # Receives TCRO payments
FAUCET_PRIVATE_KEY=0x...                 # Faucet wallet (needs CRO)

# Service URLs
BALANCE_SERVICE_URL=http://localhost:3001/api/balance
FAUCET_SERVICE_URL=http://localhost:3002/api/faucet

# Ports
PORT=8000
BALANCE_SERVICE_PORT=3001
FAUCET_SERVICE_PORT=3002
```

### Wallet Requirements

| Wallet | Token | Purpose | Required Balance |
|--------|-------|---------|------------------|
| Buyer | TCRO | Pay for services | 0.5+ TCRO |
| Seller | TCRO | Receive payments | 0 (receives) |
| Faucet | CRO | Distribute to users | 10+ CRO |

## Running the System

### Start All Services

```bash
cd server_node
pnpm run start:all
```

This starts:
- MCP Server on port 8000
- Balance Service on port 3001
- Faucet Service on port 3002

### Test the Flow

**1. Test Balance Service (direct 402 response)**
```bash
curl -X GET "http://localhost:3001/api/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

Expected: 402 Payment Required

**2. Test Complete Flow (via MCP Server)**
```bash
curl -X POST http://localhost:8000/api/process-query \
  -H "Content-Type: application/json" \
  -d '{
    "apiType": "crypto-api",
    "userInput": "check balance of 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

Expected: Balance result with payment confirmation

**3. Test Faucet Request**
```bash
curl -X POST http://localhost:8000/api/process-query \
  -H "Content-Type: application/json" \
  -d '{
    "apiType": "crypto-api",
    "userInput": "send test tokens to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

Expected: Faucet transfer confirmation

## Pricing

| Service | Price | What You Get |
|---------|-------|--------------|
| Balance Check | 0.1 TCRO | CRO balance of any address |
| Faucet Request | 0.1 TCRO | 0.1 CRO sent to address |

## Security Considerations

1. **Private Key Management**
   - Never commit `.env` file
   - Use separate wallets for buyer, seller, and faucet
   - Keep faucet wallet funded but not over-funded

2. **Payment Verification**
   - All payments verified by Cronos facilitator
   - EIP-3009 signatures prevent replay attacks
   - Nonce ensures single-use authorizations

3. **Network Security**
   - Use testnet for development
   - CORS enabled for local development
   - Production should use proper authentication

## Troubleshooting

### "Payment failed: Invalid signature"
- Check WALLET_PRIVATE_KEY is correct
- Verify chainId is "338" for testnet
- Ensure payment uses native token (asset: 0x0000...0000)

### "Insufficient funds in faucet wallet"
- Add CRO to FAUCET_PRIVATE_KEY wallet
- Check balance: `cast balance <address> --rpc-url https://evm-t3.cronos.org`

### "SELLER_WALLET environment variable is required"
- Set SELLER_WALLET in `.env`
- This is the address (not private key) that receives payments

### "Authorization already used"
- Nonce was reused (shouldn't happen with random generation)
- Restart services to clear any cached state

## Next Steps

1. **Add More Services**
   - Create additional x402-protected endpoints
   - Implement different pricing schemes

2. **Production Deployment**
   - Switch to Cronos mainnet
   - Use proper key management (HSM, KMS)
   - Add rate limiting and authentication

3. **Enhanced Features**
   - Dynamic pricing based on demand
   - Subscription models
   - Multi-token support

## References

- [x402 Buyers Documentation](docs/quick-start-for-buyers.md)
- [x402 Sellers Documentation](docs/quick-start-for-sellerts.md)
- [Cronos Facilitator](https://facilitator.cronoslabs.org)
- [Ethereum Transaction Signing](https://docs.ethers.org/v6/api/wallet/)
