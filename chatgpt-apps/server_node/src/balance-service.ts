import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import axios from 'axios';
import { ethers } from 'ethers';

const FACILITATOR_URL = 'https://facilitator.cronoslabs.org/v2/x402';
const CRONOS_TESTNET_RPC = 'https://evm-t3.cronos.org';
const NATIVE_TOKEN = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0'; // USDC

const SELLER_WALLET = process.env.SELLER_WALLET || '';
const SERVICE_PORT = Number(process.env.BALANCE_SERVICE_PORT) || 3001;
const PRICE_PER_QUERY = '100000'; // 0.1 USDC

if (!SELLER_WALLET) {
  console.error('Error: SELLER_WALLET environment variable is required');
  process.exit(1);
}

async function getBalance(address: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(CRONOS_TESTNET_RPC);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-payment');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/balance')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const address = url.searchParams.get('address');

    if (!address) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing address parameter' }));
      return;
    }

    if (!ethers.isAddress(address)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid Cronos address' }));
      return;
    }

    const paymentHeader = req.headers['x-payment'] || req.headers['X-PAYMENT'] || req.body?.paymentHeader;

    // Step 1: Check if payment is provided
    if (!paymentHeader) {
      res.writeHead(402, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Payment Required',
        x402Version: 1,
        paymentRequirements: {
          scheme: 'exact',
          network: 'cronos-testnet',
          payTo: SELLER_WALLET,
          asset: NATIVE_TOKEN,
          description: 'Balance query service - 0.1 USDC',
          mimeType: 'application/json',
          maxAmountRequired: PRICE_PER_QUERY,
          maxTimeoutSeconds: 300
        }
      }));
      return;
    }

    try {
      const requestBody = {
        x402Version: 1,
        paymentHeader: paymentHeader,
        paymentRequirements: {
          scheme: 'exact',
          network: 'cronos-testnet',
          payTo: SELLER_WALLET,
          asset: NATIVE_TOKEN,
          description: 'Balance query service - 0.1 USDC',
          mimeType: 'application/json',
          maxAmountRequired: PRICE_PER_QUERY,
          maxTimeoutSeconds: 300
        }
      };

      // Step 2: Verify payment
      const verifyRes = await axios.post(`${FACILITATOR_URL}/verify`, requestBody, {
        headers: { 'Content-Type': 'application/json', 'X402-Version': '1' }
      });
      // const balance = await getBalance(address);
        
        // res.writeHead(200, { 'Content-Type': 'application/json' });
        // res.end(JSON.stringify({
        //   success: true,
        //   address: address,
        //   balance: balance,
        //   unit: 'CRO',
        //   payment: {
        //   }
        // }));
        // return

      if (!verifyRes.data.isValid) {
        res.writeHead(402, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `Invalid payment ${verifyRes.data.invalidReason}`,
          reason: verifyRes.data.invalidReason
        }));
        return;
      }

      // Step 3: Settle payment
      const settleRes = await axios.post(`${FACILITATOR_URL}/settle`, requestBody, {
        headers: { 'Content-Type': 'application/json', 'X402-Version': '1' }
      });

      // Step 4: Check settlement and return content
      if (settleRes.data.event === 'payment.settled') {
        const balance = await getBalance(address);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          address: address,
          balance: balance,
          unit: 'CRO',
          payment: {
            txHash: settleRes.data.txHash,
            from: settleRes.data.from,
            to: settleRes.data.to,
            value: settleRes.data.value,
            blockNumber: settleRes.data.blockNumber,
            timestamp: settleRes.data.timestamp
          }
        }));
      } else {
        res.writeHead(402, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `Payment settlement failed ${settleRes.data.error}`,
          reason: settleRes.data.error
        }));
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Server error processing payment',
        details: error.response?.data || error.message
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(SERVICE_PORT, () => {
  console.log(`Balance Service (x402 Seller) listening on http://localhost:${SERVICE_PORT}`);
  console.log(`  Endpoint: GET http://localhost:${SERVICE_PORT}/api/balance?address=0x...`);
  console.log(`  Seller wallet: ${SELLER_WALLET}`);
  console.log(`  Price per query: ${PRICE_PER_QUERY} CRO (${ethers.formatUnits(PRICE_PER_QUERY, 18)} CRO)`);
});
