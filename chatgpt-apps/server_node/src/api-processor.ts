import OpenAI from 'openai';
import { ethers } from 'ethers';
import { payForResource, createWallet } from './x402-client.js';

// Service endpoints (these would be actual x402-protected services)
const BALANCE_SERVICE_URL = process.env.BALANCE_SERVICE_URL || 'http://localhost:3001/api/balance';
const FAUCET_SERVICE_URL = process.env.FAUCET_SERVICE_URL || 'http://localhost:3002/api/faucet';

interface IntentResult {
  intent: 'balance_check' | 'faucet_request' | 'unknown';
  address?: string;
  confidence: number;
}

export class ApiProcessor {
  private openai: OpenAI;
  private wallet: ethers.Wallet;

  constructor(openaiApiKey: string, privateKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.wallet = createWallet(privateKey);
  }

  async recognizeIntent(userInput: string, apiType: string): Promise<IntentResult> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an intent recognition system for blockchain API requests. Analyze the user's query and determine their intent.
            
Available intents:
1. "balance_check" - User wants to check the balance of a Cronos blockchain address
2. "faucet_request" - User wants to request test tokens from a faucet for an address
3. "unknown" - Intent doesn't match any supported operation

Extract the Cronos address (0x...) if present in the query.

Respond in JSON format:
{
  "intent": "balance_check" | "faucet_request" | "unknown",
  "address": "0x..." or null,
  "confidence": 0.0-1.0
}`
          },
          {
            role: "user",
            content: `API Type: ${apiType}\nUser Query: ${userInput}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result as IntentResult;
    } catch (error: any) {
      console.error('OpenAI intent recognition error:', error);
      return { intent: 'unknown', confidence: 0 };
    }
  }

  async processBalanceCheck(address: string): Promise<string> {
    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        return `Invalid Cronos address: ${address}`;
      }

      // Use x402-protected balance service
      const result = await payForResource(
        `${BALANCE_SERVICE_URL}?address=${address}`,
        this.wallet
      );
      
      return `Balance of ${result.address}: ${result.balance} ${result.unit}`;
    } catch (error: any) {
      console.error('Balance check error:', error);
      return `Failed to check balance: ${error.message}`;
    }
  }

  async processFaucetRequest(address: string): Promise<string> {
    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        return `Invalid Cronos address: ${address}`;
      }

      // Use x402-protected faucet service
      const result = await payForResource(
        `${FAUCET_SERVICE_URL}?address=${address}`,
        this.wallet
      );
      
      return `${result.message}\nFaucet Transaction: ${result.faucetTxHash}`;
    } catch (error: any) {
      console.error('Faucet request error:', error);
      return `Failed to process faucet request: ${error.message}`;
    }
  }

  async processQuery(apiType: string, userInput: string): Promise<any> {
    // Step 1: Recognize intent using OpenAI
    const intentResult = await this.recognizeIntent(userInput, apiType);

    console.log('Intent recognition result:', intentResult);

    // Step 2: Process based on intent
    switch (intentResult.intent) {
      case 'balance_check':
        if (!intentResult.address) {
          return {
            success: false,
            message: 'No address found in your query. Please provide a Cronos address (0x...).',
          };
        }
        const balanceResult = await this.processBalanceCheck(intentResult.address);
        return {
          success: true,
          intent: 'balance_check',
          address: intentResult.address,
          result: balanceResult,
        };

      case 'faucet_request':
        if (!intentResult.address) {
          return {
            success: false,
            message: 'No address found in your query. Please provide a Cronos address (0x...).',
          };
        }
        const faucetResult = await this.processFaucetRequest(intentResult.address);
        return {
          success: true,
          intent: 'faucet_request',
          address: intentResult.address,
          result: faucetResult,
        };

      case 'unknown':
      default:
        return {
          success: false,
          intent: 'unknown',
          message: 'Coming soon! This type of request is not yet supported. Currently we support:\n- Balance checking (e.g., "check balance of 0x...")\n- Faucet requests (e.g., "send test tokens to 0x...")',
        };
    }
  }
}
