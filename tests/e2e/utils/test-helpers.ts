import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill form field by label or placeholder
   */
  async fillField(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  /**
   * Click button by text or selector
   */
  async clickButton(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * Get text content of element
   */
  async getTextContent(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout = 10000) {
    return await this.page.waitForResponse(urlPattern, { timeout });
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string | RegExp, responseData: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
  }

  /**
   * Check if page contains text
   */
  async hasText(text: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`text=${text}`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify page title
   */
  async verifyPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Verify URL contains path
   */
  async verifyUrlContains(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    await this.page.waitForLoadState('networkidle');
    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-loading], .loading, .spinner');
      return loadingElements.length === 0;
    }, { timeout: 10000 });
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string) {
    await this.page.setInputFiles(selector, filePath);
  }

  /**
   * Clear and fill input
   */
  async clearAndFill(selector: string, value: string) {
    await this.page.fill(selector, '');
    await this.page.fill(selector, value);
  }

  /**
   * Double click element
   */
  async doubleClick(selector: string) {
    await this.page.dblclick(selector);
  }

  /**
   * Right click element
   */
  async rightClick(selector: string) {
    await this.page.click(selector, { button: 'right' });
  }

  /**
   * Hover over element
   */
  async hover(selector: string) {
    await this.page.hover(selector);
  }

  /**
   * Check if element is disabled
   */
  async isDisabled(selector: string): Promise<boolean> {
    return await this.page.isDisabled(selector);
  }

  /**
   * Check if checkbox/radio is checked
   */
  async isChecked(selector: string): Promise<boolean> {
    return await this.page.isChecked(selector);
  }

  /**
   * Get element attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.getAttribute(selector, attribute);
  }

  /**
   * Wait for element count
   */
  async waitForElementCount(selector: string, count: number, timeout = 10000) {
    await this.page.waitForFunction(
      ({ selector, count }) => document.querySelectorAll(selector).length === count,
      { selector, count },
      { timeout }
    );
  }
}

/**
 * Test data generators
 */
export class TestData {
  static generateRandomEmail(): string {
    const timestamp = Date.now();
    return `test${timestamp}@example.com`;
  }

  static generateRandomString(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateAdvertiserData() {
    return {
      name: `Test Company ${this.generateRandomString(6)}`,
      contactEmail: this.generateRandomEmail(),
      authEmail: this.generateRandomEmail(),
      website: `https://test-${this.generateRandomString(6)}.com`,
      password: 'TestPassword123!'
    };
  }

  static generatePublisherData() {
    return {
      siteName: `Test Site ${this.generateRandomString(6)}`,
      domain: `test-${this.generateRandomString(6)}.com`,
      authEmail: this.generateRandomEmail(),
      password: 'TestPassword123!'
    };
  }

  static generateCampaignData() {
    return {
      name: `Test Campaign ${this.generateRandomString(6)}`,
      description: `Test campaign description ${this.generateRandomString(10)}`,
      budgetCents: Math.floor(Math.random() * 100000) + 10000, // $100-$1000
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  static generateCreativeData() {
    return {
      name: `Test Creative ${this.generateRandomString(6)}`,
      type: 'IMAGE',
      content: `Test creative content ${this.generateRandomString(10)}`,
      targetUrl: `https://test-${this.generateRandomString(6)}.com`
    };
  }
}

/**
 * API helpers for E2E tests
 */
export class ApiHelpers {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async createTestAdvertiser(data: any) {
    const response = await fetch(`${this.baseUrl}/api/auth/advertiser/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async createTestPublisher(data: any) {
    const response = await fetch(`${this.baseUrl}/api/auth/publisher/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async loginAdvertiser(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/advertiser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authEmail: email, password })
    });
    return response.json();
  }

  async loginPublisher(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/publisher/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authEmail: email, password })
    });
    return response.json();
  }

  async createCampaign(data: any, apiKey: string) {
    const response = await fetch(`${this.baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async createCreative(data: any, apiKey: string) {
    const response = await fetch(`${this.baseUrl}/api/creatives`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
