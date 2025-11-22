# Integration Tests

Tests that require running services (Hub, PDS, Gateway).

## Prerequisites

Start all nodes before running:
```bash
cd daemon-node
npm start all
```

## Environment Variables

```bash
export HUB_URL=http://localhost:4001
export PDS_URL=http://localhost:4002
export GATEWAY_URL=http://localhost:4003
export TEST_DATABASE_URL=postgresql://user:pass@localhost/test
```

## Running

```bash
npm test -- tests/integration
```

