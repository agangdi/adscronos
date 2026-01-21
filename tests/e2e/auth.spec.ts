import { test, expect } from '@playwright/test';
import { TestHelpers, TestData } from './utils/test-helpers';

test.describe('Authentication Flows', () => {
  let helpers: TestHelpers;
  
  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Landing Page', () => {
    test('should display the main landing page correctly', async ({ page }) => {
      await helpers.navigateTo('/');
      
      // Check page title
      await expect(page).toHaveTitle(/X402 Ad Platform/);
      
      // Check main heading
      await expect(page.locator('h1')).toContainText('Next-Generation Ad Platform');
      
      // Check CTA buttons
      await expect(page.locator('text=Start Advertising')).toBeVisible();
      await expect(page.locator('text=Start Publishing')).toBeVisible();
      
      // Check navigation links
      await expect(page.locator('text=Sign In')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should navigate to advertiser registration', async ({ page }) => {
      await helpers.navigateTo('/');
      
      await helpers.clickButton('text=Start Advertising');
      await helpers.verifyUrlContains('/register');
      
      // Should have advertiser type pre-selected
      const url = page.url();
      expect(url).toContain('type=advertiser');
    });

    test('should navigate to publisher registration', async ({ page }) => {
      await helpers.navigateTo('/');
      
      await helpers.clickButton('text=Start Publishing');
      await helpers.verifyUrlContains('/register');
      
      // Should have publisher type pre-selected
      const url = page.url();
      expect(url).toContain('type=publisher');
    });
  });

  test.describe('Advertiser Registration', () => {
    test('should register a new advertiser successfully', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      
      // Verify advertiser type is selected
      await expect(page.locator('[data-testid="user-type-advertiser"]')).toHaveClass(/bg-sky-500/);
      
      // Fill registration form
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      
      // Submit form
      await helpers.clickButton('button[type="submit"]');
      
      // Should redirect to advertiser dashboard
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Verify dashboard elements
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
      await expect(page.locator('text=Campaign Performance Overview')).toBeVisible();
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      await helpers.navigateTo('/register?type=advertiser');
      
      // Try to submit empty form
      await helpers.clickButton('button[type="submit"]');
      
      // Should show validation errors (browser native validation)
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveAttribute('required');
      
      // Fill invalid email
      await helpers.fillField('input[name="authEmail"]', 'invalid-email');
      await helpers.clickButton('button[type="submit"]');
      
      // Browser should show email validation error
      const emailInput = page.locator('input[name="authEmail"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      const testData = TestData.generateAdvertiserData();
      
      // First registration
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Wait for redirect
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Try to register again with same email
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', 'Another Company');
      await helpers.fillField('input[name="contactEmail"]', 'another@example.com');
      await helpers.fillField('input[name="authEmail"]', testData.authEmail); // Same email
      await helpers.fillField('input[name="website"]', 'https://another.com');
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=already exists')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Publisher Registration', () => {
    test('should register a new publisher successfully', async ({ page }) => {
      const testData = TestData.generatePublisherData();
      
      await helpers.navigateTo('/register?type=publisher');
      
      // Verify publisher type is selected
      await expect(page.locator('[data-testid="user-type-publisher"]')).toHaveClass(/bg-emerald-500/);
      
      // Fill registration form
      await helpers.fillField('input[name="siteName"]', testData.siteName);
      await helpers.fillField('input[name="domain"]', testData.domain);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      
      // Submit form
      await helpers.clickButton('button[type="submit"]');
      
      // Should redirect to publisher dashboard
      await helpers.verifyUrlContains('/publisher/dashboard');
      
      // Verify dashboard elements
      await expect(page.locator('text=Publisher Dashboard')).toBeVisible();
      await expect(page.locator('text=Revenue & Performance Overview')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should login advertiser successfully', async ({ page }) => {
      // First, create an advertiser
      const testData = TestData.generateAdvertiserData();
      
      await helpers.navigateTo('/register?type=advertiser');
      await helpers.fillField('input[name="name"]', testData.name);
      await helpers.fillField('input[name="contactEmail"]', testData.contactEmail);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="website"]', testData.website);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Wait for dashboard
      await helpers.verifyUrlContains('/advertiser/dashboard');
      
      // Navigate to login page
      await helpers.navigateTo('/login');
      
      // Select advertiser type
      await helpers.clickButton('[data-testid="user-type-advertiser"]');
      
      // Fill login form
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      
      // Submit login
      await helpers.clickButton('button[type="submit"]');
      
      // Should redirect to advertiser dashboard
      await helpers.verifyUrlContains('/advertiser/dashboard');
      await expect(page.locator('text=Advertiser Dashboard')).toBeVisible();
    });

    test('should login publisher successfully', async ({ page }) => {
      // First, create a publisher
      const testData = TestData.generatePublisherData();
      
      await helpers.navigateTo('/register?type=publisher');
      await helpers.fillField('input[name="siteName"]', testData.siteName);
      await helpers.fillField('input[name="domain"]', testData.domain);
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      await helpers.clickButton('button[type="submit"]');
      
      // Wait for dashboard
      await helpers.verifyUrlContains('/publisher/dashboard');
      
      // Navigate to login page
      await helpers.navigateTo('/login');
      
      // Select publisher type
      await helpers.clickButton('[data-testid="user-type-publisher"]');
      
      // Fill login form
      await helpers.fillField('input[name="authEmail"]', testData.authEmail);
      await helpers.fillField('input[name="password"]', testData.password);
      
      // Submit login
      await helpers.clickButton('button[type="submit"]');
      
      // Should redirect to publisher dashboard
      await helpers.verifyUrlContains('/publisher/dashboard');
      await expect(page.locator('text=Publisher Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await helpers.navigateTo('/login');
      
      // Select advertiser type
      await helpers.clickButton('[data-testid="user-type-advertiser"]');
      
      // Fill with invalid credentials
      await helpers.fillField('input[name="authEmail"]', 'nonexistent@example.com');
      await helpers.fillField('input[name="password"]', 'wrongpassword');
      
      // Submit login
      await helpers.clickButton('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 });
    });

    test('should toggle between user types', async ({ page }) => {
      await helpers.navigateTo('/login');
      
      // Initially should have advertiser selected (default)
      await expect(page.locator('[data-testid="user-type-advertiser"]')).toHaveClass(/bg-sky-500/);
      
      // Click publisher
      await helpers.clickButton('[data-testid="user-type-publisher"]');
      await expect(page.locator('[data-testid="user-type-publisher"]')).toHaveClass(/bg-emerald-500/);
      
      // Click back to advertiser
      await helpers.clickButton('[data-testid="user-type-advertiser"]');
      await expect(page.locator('[data-testid="user-type-advertiser"]')).toHaveClass(/bg-sky-500/);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between auth pages', async ({ page }) => {
      // Start on login page
      await helpers.navigateTo('/login');
      await expect(page.locator('text=Welcome Back')).toBeVisible();
      
      // Go to register page
      await helpers.clickButton('text=Sign up');
      await helpers.verifyUrlContains('/register');
      await expect(page.locator('text=Create Account')).toBeVisible();
      
      // Go back to login
      await helpers.clickButton('text=Sign in');
      await helpers.verifyUrlContains('/login');
      await expect(page.locator('text=Welcome Back')).toBeVisible();
      
      // Go to home page
      await helpers.clickButton('text=← Back to Home');
      await helpers.verifyUrlContains('/');
      await expect(page.locator('text=Next-Generation Ad Platform')).toBeVisible();
    });
  });
});
