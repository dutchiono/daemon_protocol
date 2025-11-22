# Test Suite

Comprehensive test coverage for Daemon Social Network.

## Test Structure

```
tests/
├── unit/           # Unit tests (isolated components)
├── integration/    # Integration tests (services)
└── e2e/            # End-to-end tests (full flows)
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- tests/unit
```

### Integration Tests Only
```bash
npm test -- tests/integration
```

### E2E Tests Only
```bash
npm test -- tests/e2e
```

### Specific Test File
```bash
npm test -- tests/integration/hub.test.ts
```

## Prerequisites

1. **Start all nodes:**
   ```bash
   cd daemon-node
   npm start all
   ```

2. **Set environment variables:**
   ```bash
   export HUB_URL=http://localhost:4001
   export PDS_URL=http://localhost:4002
   export GATEWAY_URL=http://localhost:4003
   export TEST_DATABASE_URL=postgresql://user:pass@localhost/test
   ```

## Test Coverage

- ✅ Hub message validation
- ✅ PDS account creation
- ✅ Gateway feed aggregation
- ✅ End-to-end user flows
- ✅ Error handling
- ✅ Edge cases

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main
- Nightly builds

## Adding New Tests

1. Create test file in appropriate directory
2. Follow existing patterns
3. Use descriptive test names
4. Test both success and failure cases
5. Update this README

