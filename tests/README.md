# Adscronos - E2E Testing Suite

This directory contains comprehensive end-to-end tests for the Adscronos using Playwright.

## 📋 Test Coverage

### 🔐 Authentication Tests (`auth.spec.ts`)
- **Landing Page**: Navigation and CTA functionality
- **User Registration**: Advertiser and publisher registration flows
- **Login/Logout**: Authentication for both user types
- **Validation**: Form validation and error handling
- **Navigation**: Page transitions and routing

### 📊 Dashboard Tests (`dashboard.spec.ts`)
- **Advertiser Dashboard**: Performance metrics, campaign management, billing
- **Publisher Dashboard**: Revenue analytics, ad unit management, integration code
- **Admin Dashboard**: Platform-wide analytics, user management, creative approval
- **Responsive Design**: Mobile and desktop layouts
- **Data Display**: Tables, cards, and interactive elements

### 🔌 API Tests (`api.spec.ts`)
- **Authentication API**: Registration, login, token validation
- **Campaigns API**: CRUD operations, filtering, pagination
- **Creatives API**: Upload, versioning, approval workflow
- **Analytics API**: Data retrieval, filtering, date range validation
- **Billing API**: Payment tracking, status management
- **Rate Limiting**: API throttling and security
- **Error Handling**: Proper HTTP status codes and error messages

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or pnpm package manager

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:setup
```

### Environment Setup
Create a `.env` file for testing:
```env
DATABASE_URL="postgresql://localhost:5432/x402_test"
JWT_SECRET="test-jwt-secret-key"
JWT_REFRESH_SECRET="test-jwt-refresh-secret-key"
NODE_ENV="test"
```

### Database Setup
```bash
# Create test database
createdb x402_test

# Run migrations
npm run migrate
```

## 🚀 Running Tests

### Quick Start
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed
```

### Using the Test Runner Script
```bash
# Make script executable
chmod +x tests/run-e2e-tests.sh

# Run all tests
./tests/run-e2e-tests.sh

# Run specific test pattern
./tests/run-e2e-tests.sh --pattern "auth"

# Run in headed mode
./tests/run-e2e-tests.sh --headed

# Run with UI
./tests/run-e2e-tests.sh --ui
```

### Advanced Options
```bash
# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium

# Run tests with debugging
npx playwright test --debug

# Generate test report
npx playwright test --reporter=html
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── auth.spec.ts           # Authentication flow tests
│   ├── dashboard.spec.ts      # Dashboard functionality tests
│   ├── api.spec.ts           # API endpoint tests
│   ├── utils/
│   │   └── test-helpers.ts   # Reusable test utilities
│   └── setup/
│       └── global-setup.ts   # Global test setup
├── run-e2e-tests.sh          # Test runner script
└── README.md                 # This file
```

## 🔧 Test Utilities

### TestHelpers Class
Provides common testing functionality:
- Page navigation and waiting
- Form filling and button clicking
- Element visibility checks
- Screenshot capture
- API response mocking

### TestData Class
Generates test data:
- Random user credentials
- Campaign and creative data
- Realistic test scenarios

### ApiHelpers Class
Direct API testing utilities:
- User registration and login
- Campaign and creative creation
- Authentication token management

## 🎯 Test Scenarios

### User Journey Tests
1. **New Advertiser Flow**:
   - Landing page → Registration → Dashboard → Campaign creation
   
2. **New Publisher Flow**:
   - Landing page → Registration → Dashboard → Ad unit setup
   
3. **Admin Management Flow**:
   - Login → User management → Creative approval → Analytics review

### Cross-Browser Testing
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile Chrome
- ✅ Mobile Safari

### Responsive Testing
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## 📊 Test Reports

After running tests, reports are available:
- **HTML Report**: `playwright-report/index.html`
- **Screenshots**: Captured on failures
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging

## 🐛 Debugging Tests

### Common Issues
1. **Server not ready**: Ensure dev server is running on port 3000
2. **Database connection**: Check PostgreSQL is running and accessible
3. **Flaky tests**: Use `test.retry()` for unstable tests
4. **Timing issues**: Add proper `waitFor` conditions

### Debug Commands
```bash
# Run single test with debug
npx playwright test auth.spec.ts --debug

# Run with headed browser
npx playwright test --headed --slowMo=1000

# Generate trace for failed tests
npx playwright test --trace=on
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 📈 Performance Testing

Tests include performance validations:
- Page load times under 3 seconds
- API response times under 500ms
- Database query optimization
- Memory usage monitoring

## 🔒 Security Testing

Security validations covered:
- Authentication bypass attempts
- SQL injection prevention
- XSS protection
- CSRF token validation
- Rate limiting enforcement

## 📝 Best Practices

### Writing Tests
1. **Use descriptive test names**
2. **Keep tests independent**
3. **Use proper waiting strategies**
4. **Clean up test data**
5. **Mock external dependencies**

### Maintenance
1. **Update selectors when UI changes**
2. **Review and update test data**
3. **Monitor test execution times**
4. **Keep dependencies updated**

## 🤝 Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate test coverage
3. Update this README if needed
4. Ensure tests pass in CI/CD

## 📞 Support

For issues with E2E tests:
1. Check the test output and logs
2. Review the HTML report
3. Use debug mode for investigation
4. Check database and server status
