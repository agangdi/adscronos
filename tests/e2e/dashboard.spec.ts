import { test, expect } from '@playwright/test';
import { TestHelpers, TestData } from './utils/test-helpers';

test.describe('Dashboard Functionality', () => {
  let helpers: TestHelpers;
  
  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Advertiser Dashboard', () => {
    test('should display advertiser dashboard with correct sections', async ({ page }) => {
      // Create and login as advertiser
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Wait for dashboard to load
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Check main dashboard elements
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
      await expect(page.locator('text=Campaign Performance Overview')).toBeVisible();
      
      // Check overview cards
      await expect(page.locator('text=Total Campaigns')).toBeVisible();
      await expect(page.locator('text=Total Creatives')).toBeVisible();
      await expect(page.locator('text=Total Impressions')).toBeVisible();
      await expect(page.locator('text=Total Clicks')).toBeVisible();
      await expect(page.locator('text=CTR')).toBeVisible();
      await expect(page.locator('text=Total Spend')).toBeVisible();
      
      // Check sections
      await expect(page.locator('text=Campaign Status')).toBeVisible();
      await expect(page.locator('text=Creative Status')).toBeVisible();
      await expect(page.locator('text=Performance Trends')).toBeVisible();
      await expect(page.locator('text=Active Campaigns')).toBeVisible();
      await expect(page.locator('text=Recent Billing')).toBeVisible();
      
      // Check action buttons
      await expect(page.locator('text=Create Campaign')).toBeVisible();
    });

    test('should show empty state for new advertiser', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Check empty states
      await expect(page.locator('text=No campaigns yet')).toBeVisible();
      await expect(page.locator('text=No creatives yet')).toBeVisible();
      await expect(page.locator('text=No performance data available yet')).toBeVisible();
      await expect(page.locator('text=No campaigns yet. Create your first campaign')).toBeVisible();
      await expect(page.locator('text=No billing records yet')).toBeVisible();
    });

    test('should display correct metrics in overview cards', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Check initial values (should be 0 for new advertiser)
      const campaignsCard = page.locator('text=Total Campaigns').locator('..').locator('div').nth(1);
      await expect(campaignsCard).toContainText('0');
      
      const creativesCard = page.locator('text=Total Creatives').locator('..').locator('div').nth(1);
      await expect(creativesCard).toContainText('0');
      
      const impressionsCard = page.locator('text=Total Impressions').locator('..').locator('div').nth(1);
      await expect(impressionsCard).toContainText('0');
      
      const clicksCard = page.locator('text=Total Clicks').locator('..').locator('div').nth(1);
      await expect(clicksCard).toContainText('0');
      
      const ctrCard = page.locator('text=CTR').locator('..').locator('div').nth(1);
      await expect(ctrCard).toContainText('0.00%');
      
      const spendCard = page.locator('text=Total Spend').locator('..').locator('div').nth(1);
      await expect(spendCard).toContainText('$0.00');
    });
  });

  test.describe('Publisher Dashboard', () => {
    test('should display publisher dashboard with correct sections', async ({ page }) => {
      // Create and login as publisher
      const testData = TestData.generatePublisherData();
      
      await helpers.navigateTo('/register?type=publisher');
      await helpers.fillField('input[name="siteName"]', testData.siteName);
      await helpers.fillField('input[name="domain"]', testData.domain);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Wait for dashboard to load
      await helpers.verifyUrlContains('/publisher/dashboard');
      
      // Check main dashboard elements
      await expect(page.locator('text=Publisher Dashboard')).toBeVisible();
      await expect(page.locator('text=Revenue & Performance Overview')).toBeVisible();
      
      // Check overview cards
      await expect(page.locator('text=Total Ad Units')).toBeVisible();
      await expect(page.locator('text=Total Impressions')).toBeVisible();
      await expect(page.locator('text=Total Clicks')).toBeVisible();
      await expect(page.locator('text=CTR')).toBeVisible();
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=RPM')).toBeVisible();
      
      // Check sections
      await expect(page.locator('text=Webhook Delivery Status')).toBeVisible();
      await expect(page.locator('text=Integration Code')).toBeVisible();
      await expect(page.locator('text=Revenue Trends')).toBeVisible();
      await expect(page.locator('text=Ad Units')).toBeVisible();
      await expect(page.locator('text=Payment History')).toBeVisible();
      
      // Check action buttons
      await expect(page.locator('text=Create Ad Unit')).toBeVisible();
      await expect(page.locator('text=Copy Code')).toBeVisible();
      await expect(page.locator('text=Request Withdrawal')).toBeVisible();
    });

    test('should display integration code correctly', async ({ page }) => {
      const testData = TestData.generatePublisherData();
      
      await helpers.navigateTo('/register?type=publisher');
      await helpers.fillField('input[name="siteName"]', testData.siteName);
      await helpers.fillField('input[name="domain"]', testData.domain);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/publisher/dashboard');
      
      // Check integration code section
      await expect(page.locator('text=Integration Code')).toBeVisible();
      await expect(page.locator('text=Copy this code to your website')).toBeVisible();
      
      // Check code content
      await expect(page.locator('text=<script src="https://cdn.x402ads.com/sdk/ad-sdk.js"></script>')).toBeVisible();
      await expect(page.locator('text=X402Ads.init({')).toBeVisible();
      await expect(page.locator(`text=domain: "${testData.domain}"`)).toBeVisible();
      
      // Check copy button
      await expect(page.locator('text=Copy Code')).toBeVisible();
    });

    test('should show empty state for new publisher', async ({ page }) => {
      const testData = TestData.generatePublisherData();
      
      await helpers.navigateTo('/register?type=publisher');
      await helpers.fillField('input[name="siteName"]', testData.siteName);
      await helpers.fillField('input[name="domain"]', testData.domain);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/publisher/dashboard');
      
      // Check empty states
      await expect(page.locator('text=No webhook deliveries yet')).toBeVisible();
      await expect(page.locator('text=No revenue data available yet')).toBeVisible();
      await expect(page.locator('text=No ad units yet. Create your first ad unit')).toBeVisible();
      await expect(page.locator('text=No payment history yet')).toBeVisible();
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate between different dashboard sections', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Test scrolling to different sections
      await helpers.scrollToElement('text=Performance Trends');
      await expect(page.locator('text=Performance Trends')).toBeInViewport();
      
      await helpers.scrollToElement('text=Active Campaigns');
      await expect(page.locator('text=Active Campaigns')).toBeInViewport();
      
      await helpers.scrollToElement('text=Recent Billing');
      await expect(page.locator('text=Recent Billing')).toBeInViewport();
    });

    test('should handle responsive layout on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Check that dashboard is responsive
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
      await expect(page.locator('text=Campaign Performance Overview')).toBeVisible();
      
      // Cards should stack vertically on mobile
      const overviewCards = page.locator('[class*="grid"][class*="gap-4"]').first();
      await expect(overviewCards).toBeVisible();
    });
  });

  test.describe('Dashboard Interactions', () => {
    test('should handle button clicks without errors', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Test Create Campaign button (should be clickable but may not navigate yet)
      const createCampaignButton = page.locator('text=Create Campaign');
      await expect(createCampaignButton).toBeVisible();
      await expect(createCampaignButton).toBeEnabled();
      
      // Click the button (it may not have functionality yet, but should not error)
      await createCampaignButton.click();
    });

    test('should display data tables correctly', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Check campaigns table structure
      const campaignsTable = page.locator('text=Active Campaigns').locator('..').locator('table');
      await expect(campaignsTable).toBeVisible();
      
      // Check table headers
      await expect(page.locator('th:has-text("Campaign Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Budget")')).toBeVisible();
      await expect(page.locator('th:has-text("Spend")')).toBeVisible();
      await expect(page.locator('th:has-text("Impressions")')).toBeVisible();
      await expect(page.locator('th:has-text("Clicks")')).toBeVisible();
      await expect(page.locator('th:has-text("CTR")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      
      // Check billing table structure
      const billingTable = page.locator('text=Recent Billing').locator('..').locator('table');
      await expect(billingTable).toBeVisible();
      
      // Check billing table headers
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Description")')).toBeVisible();
      await expect(page.locator('th:has-text("Amount")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    });
  });
});
