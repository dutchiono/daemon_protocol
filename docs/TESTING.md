# Testing Guide

## Test Structure

```
daemon/
├── contracts/test/     # Contract unit tests
├── sdk/test/          # SDK unit tests
├── agent/test/        # Agent unit tests
├── launchpad/test/    # UI component tests
├── backend/test/      # Backend API tests
└── tests/
    ├── integration/   # Integration tests
    └── e2e/          # End-to-end tests
```

## Running Tests

### All Tests

```bash
npm test
```

### Contract Tests

```bash
cd contracts
npx hardhat test
```

### SDK Tests

```bash
cd sdk
npm test
```

### Agent Tests

```bash
cd agent
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## Test Coverage

Target: 80%+ coverage on all modules

```bash
npm run test:coverage
```

## Writing Tests

### Contract Tests

Use Hardhat/Foundry with mocked dependencies.

### SDK Tests

Use Vitest with mocked providers and contracts.

### Agent Tests

Use Vitest with mocked LLM client.

### UI Tests

Use Vitest + React Testing Library.

