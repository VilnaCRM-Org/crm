# Load Test Usage Guide

## Quick Start

### Run All Signup Tests

```bash
make test-load-signup
```

This command runs all three signup test suites in sequence:

1. ✅ **Positive tests** (`signup.js`) - Normal registration flow
2. 🛡️ **Negative tests** (`signup-negative.js`) - Validation & security
3. ⏱️ **Rate limit tests** (`signup-ratelimit.js`) - Abuse protection

## Individual Test Commands

### Run Only Positive Tests

```bash
make test-load-signup-positive
```

Tests the happy path scenarios and normal load patterns.

### Run Only Negative Tests

```bash
make test-load-signup-negative
```

Tests:

- Duplicate email registration
- Invalid email formats
- Weak passwords
- Missing required fields
- SQL injection attempts
- XSS attack attempts

### Run Only Rate Limit Tests

```bash
make test-load-signup-ratelimit
```

Tests:

- Rapid requests with same data
- Bulk registration attempts
- Rate limiting effectiveness

## Test Results

Results are saved as HTML reports in `tests/load/results/`:

- `signup.html` - Positive test results
- `signup-negative.html` - Negative test results
- `signup-ratelimit.html` - Rate limit test results

View results by opening the HTML files in a browser:

```bash
open tests/load/results/signup.html
```

## Environment Variables

Control which scenarios run using environment variables:

```bash
# Run only smoke tests
run_smoke=true make test-load-signup

# Run only average load tests
run_average=true make test-load-signup

# Run only stress tests
run_stress=true make test-load-signup

# Run only spike tests
run_spike=true make test-load-signup

# Run multiple scenarios
run_smoke=true run_average=true make test-load-signup
```

If no environment variables are set, all scenarios run.

## Test Output

Each test suite provides:

- ✅ Success indicators with emojis
- 📊 Detailed performance metrics (avg, min, med, max, p95, p99)
- 📈 Real-time web dashboard
- 📄 HTML summary report

Example output:

```bash
🧪 Running signup positive tests...
✅ Positive tests completed!

🧪 Running signup negative tests...
✅ Negative tests completed!

🧪 Running signup rate limit tests...
✅ Rate limit tests completed!

🎉 All signup load tests completed successfully!
```

## Configuration

Tests use configuration from `tests/load/config.json` or `tests/load/config.json.dist`.

The signup endpoint can have custom host/port settings:

```bash
{
  "endpoints": {
    "signup": {
      "host": "mockoon",
      "port": "8080",
      "setupTimeoutInMinutes": 10,
      "smoke": {},
      "average": {}
    }
  }
}
```

## Performance Thresholds

The tests use scenario-specific thresholds following industry best practices:

### Default Thresholds (Standard Endpoints like Homepage)

**HTTP Request Failure Rates:**

- **Smoke** (< 2%): Basic functionality verification - minimal failures expected
- **Average** (< 5%): Normal load conditions - low failure rate expected
- **Stress** (< 15%): System pushed beyond normal capacity - moderate failures acceptable
- **Spike** (< 20%): Sudden traffic bursts - higher temporary failures acceptable

**Check Pass Rates:**

- **Smoke/Average** (> 95%): Tight control under normal conditions
- **Stress** (> 90%): System under heavy load
- **Spike** (> 85%): Sudden traffic can cause more validation failures

### Endpoint-Specific Overrides

Some endpoints may have custom thresholds due to specific testing requirements.
For example, the **signup** endpoint includes negative tests (SQL injection, XSS) which
result in higher failure rates.

To configure endpoint-specific thresholds, add a `thresholds` section in `config.json`:

```bash
{
  "endpoints": {
    "signup": {
      "thresholds": {
        "errorRate": {
          "smoke": 0.15,
          "average": 0.2,
          "stress": 0.25,
          "spike": 0.3
        },
        "checkPassRate": {
          "smoke": 0.85,
          "average": 0.85,
          "stress": 0.8,
          "spike": 0.75
        }
      }
    }
  }
}
```

**Why signup has higher thresholds:**

- Includes security tests (SQL injection, XSS) that intentionally send malicious payloads
- Integration tests with multi-step flows (signup → login → access)
- Mockoon (schema-based mock) doesn't validate like a real backend
- Higher failure rates don't indicate problems - they reflect comprehensive testing

### Threshold Rationale

These thresholds account for:

- Negative/security tests returning unexpected status codes
- Integration tests with multiple failure points
- Network variability and server resource constraints
- Real-world conditions where some failures are expected under extreme load
- Different testing goals per endpoint (performance vs. security vs. integration)

## Prerequisites

- Docker and Docker Compose installed
- Production environment running (automatically started by make commands)
- K6 load testing tool (runs via Docker)

## Troubleshooting

### Tests don't start

Ensure production service is healthy:

```bash
make start-prod
make wait-for-prod-health
```

### Results directory missing

Create it manually:

```bash
mkdir -p tests/load/results
```

### Rate limiting not detected

Check warnings in test output. You may need to:

- Implement or adjust rate limiting in your API
- Configure appropriate thresholds
- Check if Mockoon (for signup) has rate limiting enabled

## CI/CD Integration

Run in CI pipelines:

```bash
# GitHub Actions example
- name: Run signup load tests
  run: make test-load-signup
```

## Next Steps

After running tests, review:

1. HTML reports for detailed metrics
2. Console warnings for missing protections
3. Error rates and response times
4. Rate limiting effectiveness

For more information, see `README-IMPROVEMENTS.md`.
