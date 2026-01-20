import { ethers } from 'ethers';
import type { PaymentRequirements } from './types';

export function generateNonce(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

export async function createPaymentHeader(
  paymentRequirements: PaymentRequirements,
  provider: ethers.BrowserProvider
): Promise<string> {
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const { payTo, asset, maxAmountRequired, maxTimeoutSeconds, scheme, network } = paymentRequirements;

  const nonce = generateNonce();
  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + maxTimeoutSeconds;

  const chainId = network === 'cronos' ? '25' : '338';

  const domain = {
    name: 'USDX Coin',
    version: '1',
    chainId,
    verifyingContract: asset,
  };

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

  const message = {
    from: address,
    to: payTo,
    value: maxAmountRequired,
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await signer.signTypedData(domain, types, message);

  const paymentHeader = {
    x402Version: 1,
    scheme,
    network,
    payload: {
      from: address,
      to: payTo,
      value: maxAmountRequired,
      validAfter,
      validBefore,
      nonce,
      signature,
      asset,
    },
  };

  return Buffer.from(JSON.stringify(paymentHeader)).toString('base64');
}

export async function connectWallet(): Promise<ethers.BrowserProvider | null> {
  if (!window.ethereum) {
    alert('Please install MetaMask or another Web3 wallet to make payments.');
    return null;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return new ethers.BrowserProvider(window.ethereum);
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

export async function switchToNetwork(network: 'cronos-testnet' | 'cronos'): Promise<boolean> {
  if (!window.ethereum) return false;

  const chainId = network === 'cronos' ? '0x19' : '0x152';
  const chainName = network === 'cronos' ? 'Cronos Mainnet' : 'Cronos Testnet';
  const rpcUrl = network === 'cronos' 
    ? 'https://evm.cronos.org' 
    : 'https://evm-t3.cronos.org';

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName,
              nativeCurrency: {
                name: 'CRO',
                symbol: 'CRO',
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: [
                network === 'cronos' 
                  ? 'https://explorer.cronos.org' 
                  : 'https://explorer.cronos.org/testnet',
              ],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add network:', addError);
        return false;
      }
    }
    console.error('Failed to switch network:', switchError);
    return false;
  }
}
