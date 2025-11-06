# k6 Load Tests

This directory contains k6 load testing scripts for the Multimedia Portal API.

## Quick Start

```bash
# Install k6 (see ../LOAD_TESTING.md for detailed installation instructions)
brew install k6  # macOS
sudo apt install k6  # Linux

# Run tests
k6 run normal-load.js      # Baseline performance test
k6 run stress-load.js      # Stress test with 100 concurrent users
k6 run spike-test.js       # Spike test with sudden traffic surge
```

## Files

- **config.js** - Shared configuration and utility functions
- **normal-load.js** - Normal load test (10 VUs, 5 minutes)
- **stress-load.js** - Stress load test (0-100 VUs, 15 minutes)
- **spike-test.js** - Spike test (10-200-10 VUs, sudden spike)

## Configuration

All tests use the following default settings:

- **API URL**: `http://localhost:3001` (override with `-e API_URL=http://your-api.com`)
- **Test Users**: Defined in `config.js`
- **Thresholds**:
  - Average response time: < 500ms
  - 95th percentile: < 1000ms
  - Error rate: < 1%

## Custom API URL

```bash
k6 run -e API_URL=http://staging-api.example.com normal-load.js
```

## Output Formats

```bash
# JSON output
k6 run --out json=results.json normal-load.js

# Cloud output (requires k6 cloud account)
k6 run --out cloud normal-load.js

# Multiple outputs
k6 run --out json=results.json --out cloud normal-load.js
```

## Documentation

For detailed documentation, see [../LOAD_TESTING.md](../LOAD_TESTING.md)
