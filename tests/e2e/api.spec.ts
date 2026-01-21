import { test, expect } from '@playwright/test';
import { TestHelpers, TestData, ApiHelpers } from './utils/test-helpers';

test.describe('API Endpoints', () => {
  let helpers: TestHelpers;
  let apiHelpers: ApiHelpers;
  
  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    apiHelpers = new ApiHelpers();
  });

  test.describe('Authentication API', () => {
    test('should register advertiser via API', async ({ request }) => {
      const testData = TestData.generateAdvertiserData();
      
      const response = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData.advertiser).toBeDefined();
      expect(responseData.advertiser.name).toBe(testData.name);
      expect(responseData.advertiser.authEmail).toBe(testData.authEmail);
      expect(responseData.token).toBeDefined();
    });

    test('should register publisher via API', async ({ request }) => {
      const testData = TestData.generatePublisherData();
      
      const response = await request.post('/api/auth/publisher/register', {
        data: testData
      });
      
      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData.publisher).toBeDefined();
      expect(responseData.publisher.siteName).toBe(testData.siteName);
      expect(responseData.publisher.authEmail).toBe(testData.authEmail);
      expect(responseData.token).toBeDefined();
    });

    test('should login advertiser via API', async ({ request }) => {
      const testData = TestData.generateAdvertiserData();
      
      // First register
      await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      // Then login
      const loginResponse = await request.post('/api/auth/advertiser/login', {
        data: {
          authEmail: testData.authEmail,
          password: testData.password
        }
      });
      
      expect(loginResponse.status()).toBe(200);
      const loginData = await loginResponse.json();
      expect(loginData.advertiser).toBeDefined();
      expect(loginData.token).toBeDefined();
    });

    test('should login publisher via API', async ({ request }) => {
      const testData = TestData.generatePublisherData();
      
      // First register
      await request.post('/api/auth/publisher/register', {
        data: testData
      });
      
      // Then login
      const loginResponse = await request.post('/api/auth/publisher/login', {
        data: {
          authEmail: testData.authEmail,
          password: testData.password
        }
      });
      
      expect(loginResponse.status()).toBe(200);
      const loginData = await loginResponse.json();
      expect(loginData.publisher).toBeDefined();
      expect(loginData.token).toBeDefined();
    });

    test('should reject invalid login credentials', async ({ request }) => {
      const response = await request.post('/api/auth/advertiser/login', {
        data: {
          authEmail: 'nonexistent@example.com',
          password: 'wrongpassword'
        }
      });
      
      expect(response.status()).toBe(401);
      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });

    test('should reject duplicate email registration', async ({ request }) => {
      const testData = TestData.generateAdvertiserData();
      
      // First registration
      const firstResponse = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      expect(firstResponse.status()).toBe(201);
      
      // Second registration with same email
      const secondResponse = await request.post('/api/auth/advertiser/register', {
        data: {
          ...testData,
          name: 'Different Company'
        }
      });
      
      expect(secondResponse.status()).toBe(400);
      const responseData = await secondResponse.json();
      expect(responseData.error).toBeDefined();
    });
  });

  test.describe('Campaigns API', () => {
    let advertiserToken: string;
    let advertiserApiKey: string;

    test.beforeEach(async ({ request }) => {
      // Create and login advertiser
      const testData = TestData.generateAdvertiserData();
      
      const registerResponse = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      const registerData = await registerResponse.json();
      advertiserToken = registerData.token;
      advertiserApiKey = registerData.advertiser.apiKey;
    });

    test('should create campaign via API', async ({ request }) => {
      const campaignData = TestData.generateCampaignData();
      
      const response = await request.post('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: campaignData
      });
      
      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData.campaign).toBeDefined();
      expect(responseData.campaign.name).toBe(campaignData.name);
      expect(responseData.campaign.description).toBe(campaignData.description);
      expect(responseData.campaign.budgetCents).toBe(campaignData.budgetCents);
    });

    test('should get campaigns via API', async ({ request }) => {
      // First create a campaign
      const campaignData = TestData.generateCampaignData();
      
      await request.post('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: campaignData
      });
      
      // Then get campaigns
      const response = await request.get('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.campaigns).toBeDefined();
      expect(Array.isArray(responseData.campaigns)).toBe(true);
      expect(responseData.campaigns.length).toBeGreaterThan(0);
      expect(responseData.pagination).toBeDefined();
    });

    test('should reject unauthorized campaign creation', async ({ request }) => {
      const campaignData = TestData.generateCampaignData();
      
      const response = await request.post('/api/campaigns', {
        data: campaignData
      });
      
      expect(response.status()).toBe(401);
    });

    test('should validate campaign data', async ({ request }) => {
      const invalidCampaignData = {
        name: '', // Invalid: empty name
        budgetCents: -100 // Invalid: negative budget
      };
      
      const response = await request.post('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: invalidCampaignData
      });
      
      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });
  });

  test.describe('Creatives API', () => {
    let advertiserToken: string;
    let campaignId: string;

    test.beforeEach(async ({ request }) => {
      // Create and login advertiser
      const testData = TestData.generateAdvertiserData();
      
      const registerResponse = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      const registerData = await registerResponse.json();
      advertiserToken = registerData.token;
      
      // Create a campaign
      const campaignData = TestData.generateCampaignData();
      const campaignResponse = await request.post('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: campaignData
      });
      
      const campaignResponseData = await campaignResponse.json();
      campaignId = campaignResponseData.campaign.id;
    });

    test('should create creative via API', async ({ request }) => {
      const creativeData = {
        ...TestData.generateCreativeData(),
        campaignId
      };
      
      const response = await request.post('/api/creatives', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: creativeData
      });
      
      expect(response.status()).toBe(201);
      const responseData = await response.json();
      expect(responseData.creative).toBeDefined();
      expect(responseData.creative.name).toBe(creativeData.name);
      expect(responseData.creative.type).toBe(creativeData.type);
      expect(responseData.creative.campaignId).toBe(campaignId);
      expect(responseData.creative.status).toBe('DRAFT');
      expect(responseData.creative.version).toBe(1);
    });

    test('should get creatives via API', async ({ request }) => {
      // First create a creative
      const creativeData = {
        ...TestData.generateCreativeData(),
        campaignId
      };
      
      await request.post('/api/creatives', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: creativeData
      });
      
      // Then get creatives
      const response = await request.get('/api/creatives', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.creatives).toBeDefined();
      expect(Array.isArray(responseData.creatives)).toBe(true);
      expect(responseData.creatives.length).toBeGreaterThan(0);
      expect(responseData.pagination).toBeDefined();
    });

    test('should filter creatives by status', async ({ request }) => {
      // Create multiple creatives
      const creativeData1 = {
        ...TestData.generateCreativeData(),
        campaignId
      };
      const creativeData2 = {
        ...TestData.generateCreativeData(),
        campaignId
      };
      
      await request.post('/api/creatives', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: creativeData1
      });
      
      await request.post('/api/creatives', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        },
        data: creativeData2
      });
      
      // Get creatives filtered by status
      const response = await request.get('/api/creatives?status=DRAFT', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.creatives).toBeDefined();
      expect(responseData.creatives.every((creative: any) => creative.status === 'DRAFT')).toBe(true);
    });

    test('should reject unauthorized creative creation', async ({ request }) => {
      const creativeData = {
        ...TestData.generateCreativeData(),
        campaignId
      };
      
      const response = await request.post('/api/creatives', {
        data: creativeData
      });
      
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Analytics API', () => {
    let advertiserToken: string;

    test.beforeEach(async ({ request }) => {
      // Create and login advertiser
      const testData = TestData.generateAdvertiserData();
      
      const registerResponse = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      const registerData = await registerResponse.json();
      advertiserToken = registerData.token;
    });

    test('should get analytics data via API', async ({ request }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      
      const response = await request.get(`/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();
      expect(responseData.totals).toBeDefined();
      expect(responseData.query).toBeDefined();
      expect(responseData.dataPoints).toBeDefined();
    });

    test('should validate analytics date range', async ({ request }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 100); // More than 90 days
      const endDate = new Date();
      
      const response = await request.get(`/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toContain('90 days');
    });

    test('should support different grouping options', async ({ request }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      
      const response = await request.get(`/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=campaign`, {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.query.groupBy).toBe('campaign');
    });

    test('should reject unauthorized analytics access', async ({ request }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      
      const response = await request.get(`/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Billing API', () => {
    let advertiserToken: string;

    test.beforeEach(async ({ request }) => {
      // Create and login advertiser
      const testData = TestData.generateAdvertiserData();
      
      const registerResponse = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      const registerData = await registerResponse.json();
      advertiserToken = registerData.token;
    });

    test('should get billing records via API', async ({ request }) => {
      const response = await request.get('/api/billing', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.billings).toBeDefined();
      expect(Array.isArray(responseData.billings)).toBe(true);
      expect(responseData.pagination).toBeDefined();
    });

    test('should filter billing by status', async ({ request }) => {
      const response = await request.get('/api/billing?status=PAID', {
        headers: {
          'Authorization': `Bearer ${advertiserToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.billings).toBeDefined();
    });

    test('should reject unauthorized billing access', async ({ request }) => {
      const response = await request.get('/api/billing');
      
      expect(response.status()).toBe(401);
    });
  });

  test.describe('API Rate Limiting', () => {
    let advertiserToken: string;

    test.beforeEach(async ({ request }) => {
      // Create and login advertiser
      const testData = TestData.generateAdvertiserData();
      
      const registerResponse = await request.post('/api/auth/advertiser/register', {
        data: testData
      });
      
      const registerData = await registerResponse.json();
      advertiserToken = registerData.token;
    });

    test('should handle multiple API requests', async ({ request }) => {
      // Make multiple requests to test rate limiting doesn't block normal usage
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request.get('/api/campaigns', {
            headers: {
              'Authorization': `Bearer ${advertiserToken}`
            }
          })
        );
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed for normal usage
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });

  test.describe('API Error Handling', () => {
    test('should return 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get('/api/nonexistent');
      expect(response.status()).toBe(404);
    });

    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post('/api/auth/advertiser/register', {
        data: 'invalid json'
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return proper CORS headers', async ({ request }) => {
      const response = await request.options('/api/campaigns');
      
      expect(response.headers()['access-control-allow-origin']).toBeDefined();
      expect(response.headers()['access-control-allow-methods']).toBeDefined();
      expect(response.headers()['access-control-allow-headers']).toBeDefined();
    });
  });
});
