import { z } from 'zod';

export const PaymentRequirementsSchema = z.object({
  scheme: z.literal('exact'),
  network: z.enum(['cronos-testnet', 'cronos']),
  payTo: z.string(),
  asset: z.string(),
  description: z.string(),
  mimeType: z.string(),
  maxAmountRequired: z.string(),
  maxTimeoutSeconds: z.number(),
});

export const PaymentHeaderPayloadSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.string(),
  validAfter: z.number(),
  validBefore: z.number(),
  nonce: z.string(),
  signature: z.string(),
  asset: z.string(),
});

export const PaymentHeaderSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal('exact'),
  network: z.enum(['cronos-testnet', 'cronos']),
  payload: PaymentHeaderPayloadSchema,
});

export const AdSessionSchema = z.object({
  adId: z.string(),
  adUrl: z.string(),
  duration: z.number(),
  resourceId: z.string(),
});

export const PremiumResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.string(),
  content: z.string().optional(),
  requiresPayment: z.boolean(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;
export type PaymentHeader = z.infer<typeof PaymentHeaderSchema>;
export type AdSession = z.infer<typeof AdSessionSchema>;
export type PremiumResource = z.infer<typeof PremiumResourceSchema>;

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
}

export interface SettleResponse {
  event: string;
  txHash?: string;
  from?: string;
  to?: string;
  value?: string;
  blockNumber?: number;
  timestamp?: number;
  error?: string;
}

export interface AdCompletionData {
  sessionId: string;
  resourceId: string;
  adId: string;
  completedAt: string;
  paymentTxHash?: string;
}
