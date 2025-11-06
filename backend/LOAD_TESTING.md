# Load Testing with k6

## Overview

This project uses [k6](https://k6.io/) for performance and load testing. k6 is a modern, developer-centric load testing tool that allows you to test the performance, reliability, and scalability of your API.

## Test Scenarios

We have implemented three comprehensive test scenarios:

### 1. Normal Load Test (`normal-load.js`)
- **Users**: 10 concurrent virtual users
- **Duration**: 5 minutes
- **Purpose**: Baseline performance testing under normal conditions
- **Thresholds**:
  - Average response time: < 500ms
  - 95th percentile: < 1000ms
  - Error rate: < 1%

### 2. Stress Load Test (`stress-load.js`)
- **Users**: Ramps from 0 to 100 concurrent users
- **Duration**: 15 minutes total
  - 2 min ramp to 20 users
  - 2 min ramp to 50 users
  - 2 min ramp to 100 users
  - 5 min sustained at 100 users
  - 2 min ramp down to 50 users
  - 2 min ramp down to 0 users
- **Purpose**: Identify performance degradation and breaking points
- **Thresholds** (relaxed for stress conditions):
  - Average response time: < 800ms
  - 95th percentile: < 1500ms
  - Error rate: < 5%

### 3. Spike Test (`spike-test.js`)
- **Users**: Sudden spike from 10 to 200 users
- **Duration**: ~4 minutes total
  - 1 min at 10 users (normal load)
  - 10 sec spike to 200 users
  - 1 min sustained at 200 users
  - 10 sec recovery to 10 users
  - 1 min verification at 10 users
- **Purpose**: Test system resilience and recovery from sudden traffic spikes
- **Thresholds** (relaxed for spike conditions):
  - Average response time: < 1000ms
  - 95th percentile: < 2000ms
  - Error rate: < 10%

## Installation

### macOS

```bash
# Using Homebrew
brew install k6

# Verify installation
k6 version
```

### Linux

```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6

# Verify installation
k6 version
```

### Windows

```bash
# Using Chocolatey
choco install k6

# Using Windows Package Manager
winget install k6 --source winget

# Verify installation
k6 version
```

### Docker

```bash
# Run k6 tests using Docker
docker pull grafana/k6:latest

# Run a test
docker run --rm -i grafana/k6:latest run - < k6-tests/normal-load.js
```

## Running Tests

### Prerequisites

1. **Start the Backend API**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Ensure Database is Running**:
   ```bash
   # If using Docker Compose
   docker-compose up -d postgres
   ```

3. **Create Test Users** (Optional):
   ```bash
   # The tests use these default test users:
   # - loadtest1@example.com / LoadTest123!
   # - loadtest2@example.com / LoadTest123!
   # - loadtest3@example.com / LoadTest123!

   # You can create them manually or let the tests handle authentication
   ```

### Running Tests

#### Normal Load Test

```bash
# Run with default settings (localhost:3001)
cd backend/k6-tests
k6 run normal-load.js

# Run with custom API URL
k6 run -e API_URL=http://your-api.com normal-load.js

# Run with custom VUs and duration
k6 run --vus 20 --duration 10m normal-load.js

# Output results to JSON
k6 run --out json=results.json normal-load.js
```

#### Stress Load Test

```bash
cd backend/k6-tests
k6 run stress-load.js

# With custom API URL
k6 run -e API_URL=http://your-api.com stress-load.js

# Generate HTML report
k6 run --out json=stress-results.json stress-load.js
```

#### Spike Test

```bash
cd backend/k6-tests
k6 run spike-test.js

# With custom API URL
k6 run -e API_URL=http://your-api.com spike-test.js
```

### Running All Tests

```bash
# Run all tests sequentially
cd backend/k6-tests
k6 run normal-load.js && k6 run stress-load.js && k6 run spike-test.js
```

## Interpreting Results

### Key Metrics

k6 provides detailed metrics for each test run:

#### HTTP Request Metrics

- **http_req_duration**: Total request duration (sending + waiting + receiving)
- **http_req_blocked**: Time waiting for a free TCP connection
- **http_req_connecting**: Time establishing TCP connection
- **http_req_sending**: Time sending request data
- **http_req_waiting**: Time waiting for server response (TTFB)
- **http_req_receiving**: Time receiving response data
- **http_req_failed**: Rate of failed requests

#### Percentiles

- **avg**: Average value
- **min**: Minimum value
- **med**: Median (50th percentile)
- **max**: Maximum value
- **p(90)**: 90th percentile (90% of requests were faster)
- **p(95)**: 95th percentile (95% of requests were faster)
- **p(99)**: 99th percentile (99% of requests were faster)

### Example Output

```
✓ list articles status 200
✓ list articles has data
✓ get article status 200

checks.........................: 97.23% ✓ 15234 ✗ 432
data_received..................: 45 MB  150 kB/s
data_sent......................: 8.2 MB 27 kB/s
http_req_blocked...............: avg=1.2ms   min=1µs    med=3µs    max=234ms  p(95)=5µs    p(99)=12ms
http_req_connecting............: avg=421µs   min=0s     med=0s     max=145ms  p(95)=0s     p(99)=3.2ms
http_req_duration..............: avg=289ms   min=45ms   med=234ms  max=2.1s   p(95)=678ms  p(99)=1.2s
  { expected_response:true }...: avg=278ms   min=45ms   med=229ms  max=1.8s   p(95)=654ms  p(99)=1.1s
http_req_failed................: 0.98%  ✓ 432  ✗ 43568
http_req_receiving.............: avg=234µs   min=12µs   med=178µs  max=23ms   p(95)=567µs  p(99)=2.1ms
http_req_sending...............: avg=87µs    min=8µs    med=45µs   max=12ms   p(95)=178µs  p(99)=456µs
http_req_waiting...............: avg=288ms   min=44ms   med=233ms  max=2.1s   p(95)=677ms  p(99)=1.2s
http_reqs......................: 44000  146.67/s
iteration_duration.............: avg=4.2s    min=1.2s   med=3.8s   max=15s    p(95)=7.8s   p(99)=11s
iterations.....................: 4400   14.67/s
vus............................: 10     min=10 max=10
vus_max........................: 10     min=10 max=10
```

### Threshold Evaluation

At the end of each test, k6 evaluates whether your defined thresholds passed:

```
✓ http_req_duration..............: avg<500ms     avg=289ms
✓ http_req_duration{type:api}....: p(95)<1000ms  p(95)=678ms
✓ http_req_failed................: rate<0.01     rate=0.0098
✗ http_req_blocked...............: avg<50ms      avg=1.2ms
```

- ✓ = Threshold passed
- ✗ = Threshold failed

## Performance Baselines

Based on Task 34.5 requirements, our API should meet these performance standards:

### Normal Load (10 Users)
- **Average Response Time**: < 500ms
- **95th Percentile**: < 1000ms
- **Error Rate**: < 1%
- **Throughput**: > 100 req/s

### Stress Load (100 Users)
- **Average Response Time**: < 800ms
- **95th Percentile**: < 1500ms
- **Error Rate**: < 5%
- **Throughput**: > 500 req/s

### Spike Load (200 Users Peak)
- **Average Response Time**: < 1000ms
- **95th Percentile**: < 2000ms
- **Error Rate**: < 10%
- **System Recovery**: < 30 seconds

## Troubleshooting

### High Error Rates

If you see high error rates (> 5%), check:

1. **Database Connection Pool**: Ensure connection pool size is adequate
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/db?connection_limit=20
   ```

2. **Server Resources**: Monitor CPU, memory, and disk I/O
   ```bash
   # Check server resources during test
   htop
   docker stats  # if using Docker
   ```

3. **Network Issues**: Verify network connectivity and latency

### High Response Times

If response times exceed thresholds:

1. **Database Query Optimization**: Check slow query logs
   ```sql
   -- Enable slow query logging in PostgreSQL
   ALTER DATABASE yourdb SET log_min_duration_statement = 100;
   ```

2. **Index Coverage**: Verify all necessary indexes are present
   ```bash
   # Review our database optimization documentation
   cat backend/DATABASE_OPTIMIZATION.md
   ```

3. **N+1 Query Problems**: Check for inefficient database queries

4. **Caching**: Consider implementing Redis caching for frequently accessed data

### Connection Timeouts

If you see connection timeout errors:

1. **Increase Server Timeout**:
   ```typescript
   // In main.ts
   const server = await app.listen(3001);
   server.setTimeout(30000); // 30 seconds
   ```

2. **Increase k6 Timeout**:
   ```javascript
   export const options = {
     httpDebug: 'full',
     insecureSkipTLSVerify: true,
     timeout: '60s',
   };
   ```

## Advanced Usage

### Custom Test Scenarios

You can create custom test scenarios by modifying the config.js and creating new test files:

```javascript
import { BASE_URL, thresholds, login } from './config.js';

export const options = {
  scenarios: {
    read_heavy: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'readHeavyScenario',
    },
    write_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      exec: 'writeHeavyScenario',
    },
  },
  thresholds,
};

export function readHeavyScenario() {
  // Read-heavy operations
}

export function writeHeavyScenario() {
  // Write-heavy operations
}
```

### Cloud Testing with k6 Cloud

For larger scale testing, you can use k6 Cloud:

```bash
# Login to k6 Cloud
k6 login cloud

# Run test in k6 Cloud
k6 cloud normal-load.js

# Run test locally but stream results to k6 Cloud
k6 run --out cloud normal-load.js
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run nightly at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Normal Load Test
        run: |
          cd backend/k6-tests
          k6 run -e API_URL=${{ secrets.API_URL }} normal-load.js

      - name: Run Stress Test
        run: |
          cd backend/k6-tests
          k6 run -e API_URL=${{ secrets.API_URL }} stress-load.js
```

## Monitoring and Observability

### Integrations

k6 can output results to various monitoring systems:

```bash
# InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 normal-load.js

# Prometheus
k6 run --out experimental-prometheus-rw normal-load.js

# Grafana Cloud
k6 run --out cloud normal-load.js

# JSON file
k6 run --out json=results.json normal-load.js

# CSV file
k6 run --out csv=results.csv normal-load.js
```

### Real-time Monitoring

Monitor your API server during load tests:

```bash
# Terminal 1: Run the load test
k6 run normal-load.js

# Terminal 2: Monitor API logs
npm run start:dev

# Terminal 3: Monitor system resources
htop

# Terminal 4: Monitor database queries
psql -U user -d db -c "SELECT * FROM pg_stat_activity;"
```

## Best Practices

1. **Start Small**: Begin with normal load tests before running stress or spike tests
2. **Isolated Environment**: Run load tests in a staging environment, not production
3. **Baseline First**: Establish performance baselines before making changes
4. **Incremental Testing**: Gradually increase load to identify performance degradation points
5. **Monitor Everything**: Track API, database, and system metrics during tests
6. **Test Regularly**: Schedule regular load tests to catch performance regressions early
7. **Clean Data**: Reset test data between runs for consistent results
8. **Document Results**: Keep records of test results for comparison over time

## Related Documentation

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [Database Optimization Guide](./DATABASE_OPTIMIZATION.md)

## Summary

✅ **Normal Load Test**: 10 VUs, 5 minutes, baseline performance
✅ **Stress Load Test**: 0-100 VUs, 15 minutes, identify breaking points
✅ **Spike Test**: 10-200-10 VUs, sudden traffic spike and recovery
✅ **Performance Thresholds**: avg < 500ms, p95 < 1s, errors < 1%
✅ **Comprehensive Documentation**: Installation, usage, and troubleshooting
✅ **CI/CD Ready**: Easy integration with GitHub Actions and other CI tools

**Result**: Complete k6 load testing suite for API performance validation
