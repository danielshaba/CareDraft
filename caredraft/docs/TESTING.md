# Testing Guide - CareDraft

This document outlines the comprehensive testing strategy and infrastructure for the CareDraft project.

## Overview

CareDraft uses a multi-layered testing approach with automated CI/CD integration:

- **Unit Tests**: Component and function-level testing with Jest
- **Integration Tests**: API and database integration testing
- **E2E Tests**: End-to-end user workflow testing with Playwright
- **Performance Tests**: Load time and resource usage monitoring
- **Coverage Reporting**: Comprehensive code coverage analysis

## Test Scripts

### Available Commands

```bash
# Standard test commands
npm test                 # Run all tests (watch mode)
npm run test:ci         # CI-optimized test run with coverage
npm run test:coverage   # Run tests with detailed coverage report

# Specialized test types
npm run test:unit       # Unit tests only (excludes e2e)
npm run test:integration # Integration tests only
npm run test:e2e        # End-to-end tests (Playwright)
npm run test:e2e:ci     # E2E tests for CI environment

# Coverage commands
npm run test:coverage:watch  # Interactive coverage testing
npm run test:coverage:open   # Generate and open HTML coverage reports

# Lint and type checking
npm run lint            # ESLint code quality checks
npm run type-check      # TypeScript type validation
```

## Testing Stack

### Core Testing Tools

- **Jest 29.7.0**: JavaScript testing framework
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM
- **Playwright 1.52.0**: Cross-browser E2E testing
- **ts-jest**: TypeScript support for Jest

### Coverage Tools

- **Istanbul/NYC**: Code coverage instrumentation
- **@codecov/webpack-plugin**: Codecov integration
- **Multiple reporters**: JSON, LCOV, HTML, Clover formats

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Coverage settings
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'json',
    'json-summary', 
    'lcov',
    'text',
    'clover',
    'html'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/e2e/**'
  ]
}
```

### Playwright Configuration

```javascript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Multiple browsers
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ]
})
```

## CI/CD Pipeline

### GitHub Actions Workflow

Our CI/CD pipeline includes:

1. **Lint & Type Check**
   - ESLint code quality validation
   - TypeScript type checking
   - Parallel execution for speed

2. **Unit Tests & Coverage**
   - Jest test execution with coverage
   - Coverage threshold enforcement (80%)
   - Coverage report artifact generation

3. **E2E Tests**
   - Multi-browser testing (Chrome, Firefox, Safari)
   - Mobile viewport testing
   - Test report generation and artifact storage

4. **Build Verification**
   - Next.js production build
   - Build artifact caching
   - Deployment preparation

### Pipeline Configuration

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  unit-tests:
    name: Unit Tests & Coverage
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:ci
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-reports
          path: coverage/

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:ci
```

## Test Types

### Unit Tests

Located in `__tests__/` directories alongside source files.

**Example:**
```typescript
// __tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})
```

### Integration Tests

Testing API routes and database interactions.

**Example:**
```typescript
// __tests__/integration/api/organizations.test.ts
import { GET, POST } from '@/app/api/organizations/route'

test('should return user organizations when authenticated', async () => {
  const response = await GET(mockRequest)
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data.organizations).toBeDefined()
})
```

### E2E Tests

Full user workflow testing with Playwright.

**Example:**
```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('should navigate to draft builder', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('[data-testid="draft-builder-link"]')
  await expect(page).toHaveURL(/.*draft-builder/)
})
```

### Performance Tests

Monitoring page load times and resource usage.

**Example:**
```typescript
// e2e/performance.spec.ts
test('homepage loads within performance budget', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  const loadTime = Date.now() - startTime
  expect(loadTime).toBeLessThan(3000) // 3 second budget
})
```

## Coverage Reporting

### Coverage Thresholds

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Reports

Generated in multiple formats:

- **HTML**: `coverage/index.html` - Interactive web report
- **LCOV**: `coverage/lcov.info` - For external tools
- **JSON**: `coverage/coverage-final.json` - Programmatic access
- **Text**: Console output during test runs

### Viewing Coverage

```bash
# Generate and open HTML coverage report
npm run test:coverage:open

# View text summary
npm run test:coverage
```

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: What is being tested and expected outcome
3. **Mock external dependencies**: Database, APIs, file system
4. **Test behavior, not implementation**: Focus on user-facing functionality
5. **Keep tests isolated**: Each test should be independent

### Test Organization

```
__tests__/
├── components/          # Component tests
├── hooks/              # Hook tests
├── lib/                # Utility function tests
├── integration/        # API and database tests
└── utils/              # Test utilities and setup

e2e/
├── auth.spec.ts        # Authentication flows
├── dashboard.spec.ts   # Dashboard functionality
├── draft-builder.spec.ts # Editor workflows
└── performance.spec.ts # Performance benchmarks
```

### Mock Setup

```typescript
// __tests__/utils/test-utils.tsx
import { render } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'

export function renderWithAuth(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  )
}
```

## Debugging Tests

### Jest Debugging

```bash
# Run specific test file
npm test Button.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Debug specific test
npx playwright test --debug dashboard.spec.ts

# Record new test
npx playwright codegen localhost:3000
```

## Continuous Integration

### Pre-commit Hooks

Consider setting up pre-commit hooks with Husky:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

### Quality Gates

Tests must pass before:
- Merging pull requests
- Deploying to staging
- Deploying to production

Coverage must meet thresholds:
- Overall coverage ≥ 80%
- No decrease in coverage
- Critical paths fully covered

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in Jest/Playwright config
2. **Module resolution**: Check `moduleNameMapper` in Jest config
3. **Browser installation**: Run `npx playwright install`
4. **Coverage failing**: Review exclusion patterns

### Getting Help

- Check test logs for detailed error messages
- Use `--verbose` flag for detailed test output
- Review coverage reports to identify gaps
- Use Playwright trace viewer for E2E debugging

## Future Enhancements

- **Visual regression testing** with Percy or Chromatic
- **Accessibility testing** with @testing-library/jest-axe
- **Load testing** with k6 or Artillery
- **Contract testing** with Pact
- **Mutation testing** with Stryker 