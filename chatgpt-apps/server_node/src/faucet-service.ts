import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import axios from 'axios';
import { ethers } from 'ethers';

const FACILITATOR_URL = 'https://facilitator.cronoslabs.org/v2/x402';
const CRONOS_TESTNET_RPC = 'https://evm-t3.cronos.org';
const NATIVE_TOKEN = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0'; // USDC

const SELLER_WALLET = process.env.SELLER_WALLET || '';
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || '';
const SERVICE_PORT = Number(process.env.FAUCET_SERVICE_PORT) || 3002;
const PRICE_PER_REQUEST = '100000'; // 0.1 TCRO
const FAUCET_AMOUNT = '0.1'; // 0.1 CRO per request

if (!SELLER_WALLET) {
  console.error('Error: SELLER_WALLET environment variable is required');
  process.exit(1);
}

if (!FAUCET_PRIVATE_KEY) {
  console.error('Error: FAUCET_PRIVATE_KEY environment variable is required');
  process.exit(1);
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

  if (req.method === 'GET' && req.url?.startsWith('/api/faucet')) {
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

    const paymentHeader = req.headers['x-payment'] as string | undefined;

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
          description: 'Faucet service - Get 0.1 USDC (Pay 0.1 TCRO)',
          mimeType: 'application/json',
          maxAmountRequired: PRICE_PER_REQUEST,
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
          description: 'Faucet service - Get 0.1 USDC (Pay 0.1 TCRO)',
          mimeType: 'application/json',
          maxAmountRequired: PRICE_PER_REQUEST,
          maxTimeoutSeconds: 300
        }
      };

      // Step 2: Verify payment
      const verifyRes = await axios.post(`${FACILITATOR_URL}/verify`, requestBody, {
        headers: { 'Content-Type': 'application/json', 'X402-Version': '1' }
      });

      // const provider = new ethers.JsonRpcProvider(CRONOS_TESTNET_RPC);
      //   const faucetWallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);

      //   // Check faucet balance
      //   const faucetBalance = await provider.getBalance(faucetWallet.address);
      //   const amountToSend = ethers.parseEther(FAUCET_AMOUNT);

      //   if (faucetBalance < amountToSend) {
      //     res.writeHead(503, { 'Content-Type': 'application/json' });
      //     res.end(JSON.stringify({
      //       error: 'Service temporarily unavailable',
      //       reason: 'Insufficient funds in faucet wallet'–
      //     }));
      //     return;
      //   }

      //   // Send CRO to the requested address
      //   const tx = await faucetWallet.sendTransaction({
      //     to: address,
      //     value: amountToSend,
      //   });

      //   await tx.wait();

      //   res.writeHead(200, { 'Content-Type': 'application/json' });
      //   res.end(JSON.stringify({
      //     success: true,
      //     message: `Successfully sent ${FAUCET_AMOUNT} CRO to ${address}`,
      //     recipient: address,
      //     amount: FAUCET_AMOUNT,
      //     unit: 'CRO',
      //     faucetTxHash: tx.hash,
      //     payment: {

      //     }
      //   }));
      //   return

      if (!verifyRes.data.isValid) {
        res.writeHead(402, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid payment',
          reason: verifyRes.data.invalidReason
        }));
        return;
      }

      // Step 3: Settle payment
      const settleRes = await axios.post(`${FACILITATOR_URL}/settle`, requestBody, {
        headers: { 'Content-Type': 'application/json', 'X402-Version': '1' }
      });

      // Step 4: Check settlement and perform faucet transfer
      if (settleRes.data.event === 'payment.settled') {
        const provider = new ethers.JsonRpcProvider(CRONOS_TESTNET_RPC);
        const faucetWallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);

        // Check faucet balance
        const faucetBalance = await provider.getBalance(faucetWallet.address);
        const amountToSend = ethers.parseEther(FAUCET_AMOUNT);

        if (faucetBalance < amountToSend) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Service temporarily unavailable',
            reason: 'Insufficient funds in faucet wallet'
          }));
          return;
        }

        // Send CRO to the requested address
        const tx = await faucetWallet.sendTransaction({
          to: address,
          value: amountToSend,
        });

        await tx.wait();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Successfully sent ${FAUCET_AMOUNT} CRO to ${address}`,
          recipient: address,
          amount: FAUCET_AMOUNT,
          unit: 'CRO',
          faucetTxHash: tx.hash,
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
          error: `Payment settlement Failed ${settleRes.data.error}`,
          reason: settleRes.data.error
        }));
      }
    } catch (error: any) {
      console.error('Error processing faucet request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Server error processing faucet request',
        details: error.response?.data || error.message
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(SERVICE_PORT, () => {
  console.log(`Faucet Service (x402 Seller) listening on http://localhost:${SERVICE_PORT}`);
  console.log(`  Endpoint: GET http://localhost:${SERVICE_PORT}/api/faucet?address=0x...`);
  console.log(`  Seller wallet: ${SELLER_WALLET}`);
  console.log(`  Price per request: ${PRICE_PER_REQUEST} wei (${ethers.formatUnits(PRICE_PER_REQUEST, 18)} USDX)`);
  console.log(`  Faucet amount: ${FAUCET_AMOUNT} CRO`);
});
