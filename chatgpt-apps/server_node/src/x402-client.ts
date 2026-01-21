import axios from 'axios';
import { ethers } from 'ethers';

const CRONOS_TESTNET_RPC = 'https://evm-t3.cronos.org';

interface PaymentRequirements {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  description: string;
  mimeType: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
}

function generateNonce(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

async function createPaymentHeader(
  wallet: ethers.Wallet,
  paymentRequirements: PaymentRequirements
): Promise<string> {
  const { payTo, asset, maxAmountRequired, maxTimeoutSeconds, scheme, network } = paymentRequirements;

  // Generate unique nonce
  const nonce = generateNonce();
  
  // Calculate validity window
  const validAfter = 0; // Valid immediately
  const validBefore = Math.floor(Date.now() / 1000) + maxTimeoutSeconds;

  // Set up EIP-712 domain for the token contract
  const domain = {
    name: "Bridged USDC (Stargate)",
    version: "1",
    chainId: "338",
    verifyingContract: asset,
  };

  // Define EIP-712 typed data structure for EIP-3009
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  // Create the message to sign
  const message = {
    from: wallet.address,
    to: payTo,
    value: maxAmountRequired,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };

  // Sign using EIP-712 typed data
  const signature = await wallet.signTypedData(domain, types, message);

  console.log(signature)

  // Construct payment header
  const paymentHeader = {
    x402Version: 1,
    scheme: scheme,
    network: network,
    payload: {
      from: wallet.address,
      to: payTo,
      value: maxAmountRequired,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce,
      signature: signature,
      asset: asset,
    },
  };
  console.log({paymentHeader})

  // Base64-encode the payment header
  return Buffer.from(JSON.stringify(paymentHeader)).toString('base64');
}

export async function payForResource(
  resourceUrl: string,
  wallet: ethers.Wallet
): Promise<any> {
  try {
    // Step 1: Initial request (expect 402)
    const initialResponse = await axios.get(resourceUrl).catch(err => err.response);

    // Step 2: Check for 402 Payment Required
    if (initialResponse.status !== 402) {
      return initialResponse.data;
    }

    const { paymentRequirements } = initialResponse.data;

    // Step 3: Generate payment header
    const paymentHeaderBase64 = await createPaymentHeader(wallet, paymentRequirements);

    // Step 4: Retry with payment
    const paidResponse = await axios.get(resourceUrl, {
      headers: { 'X-PAYMENT': paymentHeaderBase64 },
    });

    return paidResponse.data;
  } catch (error: any) {
    throw new Error(`Payment failed: ${error.response?.data?.error || error.message}`);
  }
}

export function createWallet(privateKey: string): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(CRONOS_TESTNET_RPC);
  return new ethers.Wallet(privateKey, provider);
}

export async function getBalance(address: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(CRONOS_TESTNET_RPC);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}
