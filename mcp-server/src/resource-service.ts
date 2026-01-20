import axios from 'axios';
import { config } from './config.js';
import type { PremiumResource, AdSession } from './types.js';

export class ResourceService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = config.apiBaseUrl;
  }

  async listPremiumResources(): Promise<PremiumResource[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/chatgpt/resources`);
      return response.data.resources || [];
    } catch (error) {
      console.error('Error fetching premium resources:', error);
      return [];
    }
  }

  async getResourceById(resourceId: string): Promise<PremiumResource | null> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/chatgpt/resources/${resourceId}`);
      return response.data.resource || null;
    } catch (error) {
      console.error(`Error fetching resource ${resourceId}:`, error);
      return null;
    }
  }

  async createAdSession(resourceId: string, userId: string): Promise<AdSession | null> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/chatgpt/ads/session`, {
        resourceId,
        userId,
      });
      
      return response.data.session || null;
    } catch (error) {
      console.error('Error creating ad session:', error);
      return null;
    }
  }

  async completeAdSession(sessionId: string, paymentTxHash?: string): Promise<boolean> {
    try {
      await axios.post(`${this.apiBaseUrl}/api/chatgpt/ads/complete`, {
        sessionId,
        paymentTxHash,
      });
      return true;
    } catch (error) {
      console.error('Error completing ad session:', error);
      return false;
    }
  }

  async accessPremiumContent(
    resourceId: string,
    userId: string,
    paymentTxHash?: string
  ): Promise<{ content: string; payment?: any } | null> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/api/chatgpt/resources/${resourceId}/access`,
        {
          userId,
          paymentTxHash,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error accessing premium content:', error);
      return null;
    }
  }
}
