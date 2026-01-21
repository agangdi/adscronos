const { ethers } = require('ethers');

/**
 * Generates a random 32-byte nonce for EIP-3009 authorization
 */
function generateNonce() {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Creates a signed payment header for x402 payments
 */
async function createPaymentHeader({ wallet, paymentRequirements, network }) {
  const { payTo, asset, maxAmountRequired, maxTimeoutSeconds, scheme } = paymentRequirements;

  // Generate unique nonce
  const nonce = generateNonce();
  
  // Calculate validity window
  const validAfter = 0; // Valid immediately
  const validBefore = Math.floor(Date.now() / 1000) + maxTimeoutSeconds;

  // Set up EIP-712 domain
  const domain = {
    name: "Bridged USDC (Stargate)",
    version: "1",
    chainId: "338",
    verifyingContract: asset,
  };

  // Define EIP-712 typed data structure
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

  // Sign using EIP-712
  const signature = await wallet.signTypedData(domain, types, message);

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

  // Base64-encode
  return Buffer.from(JSON.stringify(paymentHeader)).toString('base64');
}

module.exports = { createPaymentHeader};
