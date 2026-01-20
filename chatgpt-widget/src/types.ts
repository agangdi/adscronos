export interface WindowOpenAI {
  toolOutput?: ToolOutput;
  toolResponseMetadata?: any;
  toolInput?: any;
  widgetState?: any;
  setWidgetState: (state: any) => void;
  callTool: (toolName: string, args: any) => Promise<any>;
  sendFollowUpMessage: (message: string) => void;
  theme?: 'light' | 'dark';
  displayMode?: 'inline' | 'fullscreen';
  requestModal?: (options: any) => void;
  notifyIntrinsicHeight?: (height: number) => void;
}

export interface ToolOutput {
  resources?: PremiumResource[];
  resourceId?: string;
  title?: string;
  requiresAd?: boolean;
  adDuration?: number;
  hasAccess?: boolean;
  paymentCompleted?: boolean;
  txHash?: string;
  error?: string;
}

export interface ToolMetadata {
  resource?: PremiumResource;
  adSession?: AdSession;
  paymentRequirements?: PaymentRequirements;
  content?: string;
  payment?: PaymentInfo;
  action?: string;
  requiresPayment?: boolean;
  error?: boolean;
}

export interface PremiumResource {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  requiresPayment: boolean;
}

export interface AdSession {
  adId: string;
  adUrl: string;
  duration: number;
  resourceId: string;
}

export interface PaymentRequirements {
  scheme: 'exact';
  network: 'cronos-testnet' | 'cronos';
  payTo: string;
  asset: string;
  description: string;
  mimeType: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
}

export interface PaymentInfo {
  txHash?: string;
  from?: string;
  to?: string;
  value?: string;
  blockNumber?: number;
  timestamp?: number;
}

declare global {
  interface Window {
    openai: WindowOpenAI;
    ethereum?: any;
  }
}
