export const MCP_CONFIG = {
  x402: {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://facilitator.cronoslabs.org/v2/x402',
    network: process.env.X402_NETWORK || 'cronos-testnet',
    sellerWallet: process.env.SELLER_WALLET || '',
    usdxContract: process.env.USDX_CONTRACT || '0x149a72BCdFF5513F2866e9b6394edba2884dbA07',
  },
  payment: {
    defaultPrice: process.env.DEFAULT_PRICE || '1000000',
    timeout: parseInt(process.env.PAYMENT_TIMEOUT || '300'),
  },
  widget: {
    domain: process.env.WIDGET_DOMAIN || 'https://chatgpt.com',
  },
};

export function validateMCPConfig() {
  if (!MCP_CONFIG.x402.sellerWallet) {
    console.warn('SELLER_WALLET not configured - X402 payments will not work');
  }
  return MCP_CONFIG;
}
