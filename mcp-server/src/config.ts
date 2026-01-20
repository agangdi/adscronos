export const config = {
  // X402 Facilitator
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://facilitator.cronoslabs.org/v2/x402',
  
  // Network configuration
  network: (process.env.X402_NETWORK || 'cronos-testnet') as 'cronos-testnet' | 'cronos',
  
  // Seller wallet (receives payments)
  sellerWallet: process.env.SELLER_WALLET || '0x477F2224bd0745B309362D5D0BeE3f2812f6F329',
  
  // USDX token contract address
  usdxContract: process.env.USDX_CONTRACT || '0x149a72BCdFF5513F2866e9b6394edba2884dbA07',
  
  // Payment settings
  defaultPrice: process.env.DEFAULT_PRICE || '1000000', // 1 USDX (6 decimals)
  paymentTimeout: parseInt(process.env.PAYMENT_TIMEOUT || '300'), // 5 minutes
  
  // Server configuration
  port: parseInt(process.env.MCP_PORT || '3001'),
  host: process.env.MCP_HOST || 'localhost',
  
  // Widget configuration
  widgetDomain: process.env.WIDGET_DOMAIN || 'https://chatgpt.com',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  
  // Ad platform integration
  adPlatformUrl: process.env.AD_PLATFORM_URL || 'http://localhost:3000/api',
};

export function validateConfig() {
  if (!config.sellerWallet) {
    throw new Error('SELLER_WALLET environment variable is required');
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(config.sellerWallet)) {
    throw new Error('SELLER_WALLET must be a valid Ethereum address');
  }
  
  console.log('✓ Configuration validated');
  console.log(`  Network: ${config.network}`);
  console.log(`  Seller: ${config.sellerWallet}`);
  console.log(`  USDX: ${config.usdxContract}`);
}
