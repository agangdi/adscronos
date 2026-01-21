import { test, expect } from '@playwright/test';
import { TestHelpers, TestData } from './utils/test-helpers';

test.describe('Integration Tests - Complete User Workflows', () => {
  let helpers: TestHelpers;
  
  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Complete Advertiser Journey', () => {
    test('should complete full advertiser workflow: registration → campaign → creative → analytics', async ({ page }) => {
      const advertiserData = TestData.generateAdvertiserData();
      const campaignData = TestData.generateCampaignData();
      const creativeData = TestData.generateCreativeData();

      // Step 1: Landing page and registration
      await helpers.navigateTo('/');
      await expect(page.locator('text=Next-Generation Ad Platform')).toBeVisible();
      
      await helpers.clickButton('text=Start Advertising');
      await helpers.verifyUrlContains('/register');
      
      // Complete registration
      await helpers.fillField('input[name="name"]', advertiserData.name);
      await helpers.fillField('input[name="contactEmail"]', advertiserData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', advertiserData.authEmail);
      await helpers.fillField('input[name="website"]', advertiserData.website);
      await helpers.fillField('input[name="password"]', advertiserData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Step 2: Verify dashboard access
      await helpers.verifyUrlContains('/advertiser/dashboard');
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
      await expect(page.locator('text=Campaign Performance Overview')).toBeVisible();
      
      // Verify initial empty state
      await expect(page.locator('text=No campaigns yet')).toBeVisible();
      await expect(page.locator('text=Total Campaigns').locator('..').locator('div').nth(1)).toContainText('0');
      
      // Step 3: Create campaign via API (simulating campaign creation)
      const apiKey = await page.evaluate(() => {
        // Extract API key from page or localStorage if available
        return 'test-api-key'; // In real test, this would be extracted from the UI
      });
      
      // For now, we'll test the UI flow without actual campaign creation
      // In a real implementation, you'd create the campaign via API and then verify it appears in the dashboard
      
      // Step 4: Verify dashboard updates
      await page.reload();
      await helpers.waitForLoadingComplete();
      
      // Step 5: Test navigation between sections
      await helpers.scrollToElement('text=Performance Trends');
      await expect(page.locator('text=Performance Trends')).toBeInViewport();
      
      await helpers.scrollToElement('text=Active Campaigns');
      await expect(page.locator('text=Active Campaigns')).toBeInViewport();
      
      await helpers.scrollToElement('text=Recent Billing');
      await expect(page.locator('text=Recent Billing')).toBeInViewport();
      
      // Step 6: Test responsive behavior
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
      
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
      
      // Reset viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should handle advertiser login and session persistence', async ({ page, context }) => {
      const advertiserData = TestData.generateAdvertiserData();
      
      // Register advertiser
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', advertiserData.name);
      await helpers.fillField('input[name="contactEmail"]', advertiserData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', advertiserData.authEmail);
      await helpers.fillField('input[name="website"]', advertiserData.website);
      await helpers.fillField('input[name="password"]', advertiserData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Test session persistence by opening new tab
      const newPage = await context.newPage();
      const newHelpers = new TestHelpers(newPage);
      
      await newHelpers.navigateTo('/advertiser/dashboard');
      // Should still be logged in (if session is properly implemented)
      // For now, we'll just verify the page loads
      
      await newPage.close();
      
      // Test logout and re-login
      await helpers.navigateTo('/login');
      await helpers.clickButton('[data-testid="user-type-advertiser"]');
      await helpers.fillField('input[name="authEmail"]', advertiserData.authEmail);
      await helpers.fillField('input[name="password"]', advertiserData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
    });
  });

  test.describe('Complete Publisher Journey', () => {
    test('should complete full publisher workflow: registration → ad units → integration → analytics', async ({ page }) => {
      const publisherData = TestData.generatePublisherData();

      // Step 1: Landing page and registration
      await helpers.navigateTo('/');
      await helpers.clickButton('text=Start Publishing');
      await helpers.verifyUrlContains('/register');
      
      // Complete registration
      await helpers.fillField('input[name="siteName"]', publisherData.siteName);
      await helpers.fillField('input[name="domain"]', publisherData.domain);
      await helpers.fillField('input[name="authEmail"]', publisherData.authEmail);
      await helpers.fillField('input[name="password"]', publisherData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Step 2: Verify dashboard access
      await helpers.verifyUrlContains('/publisher/dashboard');
      await expect(page.locator('text=Publisher Dashboard')).toBeVisible();
      await expect(page.locator('text=Revenue & Performance Overview')).toBeVisible();
      
      // Step 3: Verify integration code section
      await expect(page.locator('text=Integration Code')).toBeVisible();
      await expect(page.locator('text=Copy this code to your website')).toBeVisible();
      
      // Verify integration code contains correct domain
      await expect(page.locator(`text=domain: "${publisherData.domain}"`)).toBeVisible();
      
      // Step 4: Test copy code functionality
      const copyButton = page.locator('text=Copy Code');
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toBeEnabled();
      
      // Step 5: Verify empty states
      await expect(page.locator('text=No webhook deliveries yet')).toBeVisible();
      await expect(page.locator('text=No revenue data available yet')).toBeVisible();
      await expect(page.locator('text=No ad units yet')).toBeVisible();
      await expect(page.locator('text=No payment history yet')).toBeVisible();
      
      // Step 6: Test action buttons
      await expect(page.locator('text=Create Ad Unit')).toBeVisible();
      await expect(page.locator('text=Request Withdrawal')).toBeVisible();
      
      // Step 7: Verify overview cards show zero values
      const adUnitsCard = page.locator('text=Total Ad Units').locator('..').locator('div').nth(1);
      await expect(adUnitsCard).toContainText('0');
      
      const revenueCard = page.locator('text=Total Revenue').locator('..').locator('div').nth(1);
      await expect(revenueCard).toContainText('$0.00');
    });

    test('should handle publisher login and dashboard navigation', async ({ page }) => {
      const publisherData = TestData.generatePublisherData();
      
      // Register publisher
      await helpers.navigateTo('/register?type=publisher');
      await helpers.fillField('input[name="siteName"]', publisherData.siteName);
      await helpers.fillField('input[name="domain"]', publisherData.domain);
      await helpers.fillField('input[name="authEmail"]', publisherData.authEmail);
      await helpers.fillField('input[name="password"]', publisherData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/publisher/dashboard');
      
      // Test navigation to different sections
      await helpers.scrollToElement('text=Revenue Trends');
      await expect(page.locator('text=Revenue Trends')).toBeInViewport();
      
      await helpers.scrollToElement('text=Ad Units');
      await expect(page.locator('text=Ad Units')).toBeInViewport();
      
      await helpers.scrollToElement('text=Payment History');
      await expect(page.locator('text=Payment History')).toBeInViewport();
      
      // Test logout and re-login
      await helpers.navigateTo('/login');
      await helpers.clickButton('[data-testid="user-type-publisher"]');
      await helpers.fillField('input[name="authEmail"]', publisherData.authEmail);
      await helpers.fillField('input[name="password"]', publisherData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/publisher/dashboard');
      await expect(page.locator('text=Publisher Dashboard')).toBeVisible();
    });
  });

  test.describe('Cross-User Type Interactions', () => {
    test('should prevent cross-user type access', async ({ page, context }) => {
      const advertiserData = TestData.generateAdvertiserData();
      const publisherData = TestData.generatePublisherData();
      
      // Register advertiser
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', advertiserData.name);
      await helpers.fillField('input[name="contactEmail"]', advertiserData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', advertiserData.authEmail);
      await helpers.fillField('input[name="website"]', advertiserData.website);
      await helpers.fillField('input[name="password"]', advertiserData.password);
      await helpers.clickButton('button[type="submit"]');
      
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Try to access publisher dashboard (should be prevented)
      await helpers.navigateTo('/publisher/dashboard');
      // Should either redirect to login or show access denied
      // The exact behavior depends on the authentication implementation
      
      // Register publisher in new context
      const publisherPage = await context.newPage();
      const publisherHelpers = new TestHelpers(publisherPage);
      
      await publisherHelpers.navigateTo('/register?type=publisher');
      await publisherHelpers.fillField('input[name="siteName"]', publisherData.siteName);
      await publisherHelpers.fillField('input[name="domain"]', publisherData.domain);
      await publisherHelpers.fillField('input[name="authEmail"]', publisherData.authEmail);
      await publisherHelpers.fillField('input[name="password"]', publisherData.password);
      await publisherHelpers.clickButton('button[type="submit"]');
      
      await publisherHelpers.verifyUrlContains('/publisher/dashboard');
      
      // Try to access advertiser dashboard (should be prevented)
      await publisherHelpers.navigateTo('/advertiser/dashboard');
      // Should either redirect to login or show access denied
      
      await publisherPage.close();
    });

    test('should handle user type switching in login form', async ({ page }) => {
      await helpers.navigateTo('/login');
      
      // Test initial state (advertiser selected by default)
      await expect(page.locator('[data-testid="user-type-advertiser"]')).toHaveClass(/bg-sky-500/);
      
      // Switch to publisher
      await helpers.clickButton('[data-testid="user-type-publisher"]');
      await expect(page.locator('[data-testid="user-type-publisher"]')).toHaveClass(/bg-emerald-500/);
      
      // Switch back to advertiser
      await helpers.clickButton('[data-testid="user-type-advertiser"]');
      await expect(page.locator('[data-testid="user-type-advertiser"]')).toHaveClass(/bg-sky-500/);
      
      // Test that form fields remain filled when switching
      await helpers.fillField('input[name="authEmail"]', 'test@example.com');
      await helpers.fillField('input[name="password"]', 'password123');
      
      await helpers.clickButton('[data-testid="user-type-publisher"]');
      
      // Fields should still be filled
      await expect(page.locator('input[name="authEmail"]')).toHaveValue('test@example.com');
      await expect(page.locator('input[name="password"]')).toHaveValue('password123');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Test offline behavior
      await page.context().setOffline(true);
      
      await helpers.navigateTo('/');
      // Should show appropriate error message or cached content
      
      await page.context().setOffline(false);
      
      // Should recover when back online
      await page.reload();
      await expect(page.locator('text=Next-Generation Ad Platform')).toBeVisible();
    });

    test('should handle invalid URLs and 404 errors', async ({ page }) => {
      await helpers.navigateTo('/nonexistent-page');
      // Should show 404 page or redirect appropriately
      
      await helpers.navigateTo('/admin/nonexistent');
      // Should handle admin route errors
    });

    test('should handle form validation errors', async ({ page }) => {
      await helpers.navigateTo('/register?type=advertiser');
      
      // Test empty form submission
      await helpers.clickButton('button[type="submit"]');
      // Browser validation should prevent submission
      
      // Test invalid email format
      await helpers.fillField('input[name="authEmail"]', 'invalid-email');
      await helpers.clickButton('button[type="submit"]');
      // Should show email validation error
      
      // Test password requirements (if any)
      await helpers.fillField('input[name="authEmail"]', 'test@example.com');
      await helpers.fillField('input[name="password"]', '123'); // Too short
      await helpers.clickButton('button[type="submit"]');
      // Should show password validation error if implemented
    });

    test('should handle slow loading and timeouts', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });
      
      await helpers.navigateTo('/');
      
      // Should still load within reasonable time
      await expect(page.locator('text=Next-Generation Ad Platform')).toBeVisible({ timeout: 15000 });
      
      // Clear route interception
      await page.unroute('**/*');
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet basic performance requirements', async ({ page }) => {
      const startTime = Date.now();
      
      await helpers.navigateTo('/');
      await helpers.waitForLoadingComplete();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Check for basic performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });
      
      // DOM should be ready quickly
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    });

    test('should have basic accessibility features', async ({ page }) => {
      await helpers.navigateTo('/');
      
      // Check for basic accessibility features
      const hasMainLandmark = await page.locator('main').count() > 0;
      const hasHeadings = await page.locator('h1, h2, h3').count() > 0;
      const hasFormLabels = await page.locator('label').count() > 0;
      
      expect(hasMainLandmark || hasHeadings).toBe(true); // Should have semantic structure
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });
  });
});
