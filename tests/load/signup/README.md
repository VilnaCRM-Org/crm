# Signup Load Tests

Comprehensive load testing suite for the user registration (signup) endpoint.
These tests validate performance, reliability, security, and error handling under
various load conditions.

## File Structure

```bash
signup/
├── README.md        # This documentation
├── positive.js      # Happy path / normal registration tests
├── negative.js      # Validation, error handling, and security tests
├── ratelimit.js     # Rate limiting and abuse protection tests
└── integration.js   # End-to-end user flow tests
```

## Test Categories

### 1. Positive Tests (`positive.js`)

Tests the normal user registration flow under load to ensure the system handles legitimate signups reliably.

**What it tests:**

- User registration with valid data
- Response format and data integrity
- Success rate under load (201/200 status codes)
- JSON response structure validation

**Key metrics:**

- Registration success rate
- Response times (p95, p99)
- Data consistency

### 2. Negative Tests (`negative.js`)

Tests validation, error handling, and security measures to ensure
the system properly rejects invalid inputs.

**What it tests:**

- **Duplicate email** registration (409/400)
- **Invalid email formats** (3 patterns: no @, no domain, empty)
- **Weak/missing passwords** (2 patterns: empty, too short)
- **Password requirements** (4 rules: uppercase, lowercase, numbers, special chars)
- **Missing required fields** (2 combinations)
- **SQL injection** attempts (2 attack vectors)
- **XSS attacks** (2 payload types: script tag, onerror)

**Key features:**

- Reduced test counts for load efficiency
- Accepts any 4xx/5xx error response under load
- Validates error message structure for expected errors

### 3. Rate Limit Tests (`ratelimit.js`)

Tests abuse protection mechanisms to verify the system can defend
against malicious bulk registration attempts.

**What it tests:**

- Rapid duplicate registration attempts (same email, 15 requests)
- Bulk registration attempts (different emails, 15 requests)
- Rate limiting detection and response (429 status code)

**Key features:**

- Runs only on first iteration per VU to avoid overwhelming system
- Informational logging (not failure-based)
- Tracks whether rate limiting is implemented

**Expected behavior:**

- If rate limiting exists: Returns 429 (Too Many Requests)
- If not implemented: Logs `[INFO]` message (not a failure)

### 4. Integration Tests (`integration.js`) **[NEW]**

Tests end-to-end user flows to validate complete user journeys across multiple endpoints.

**What it tests:**

1. **Signup → Login → Access Protected Resource**
   - Register new user
   - Login with credentials
   - Access user profile with authentication token

2. **Duplicate Signup Flow**
   - Register user
   - Attempt duplicate registration
   - Verify rejection (400/409)

3. **Invalid Signup → Login Attempt**
   - Attempt registration with invalid data
   - Verify account is not created
   - Confirm login fails (401/404)

**Key metrics:**

- End-to-end success rate
- Authentication flow reliability
- Cross-endpoint consistency

## Running Tests

### Run All Tests (Recommended)

```bash
make test-load-signup
```

This executes `signup.js` which runs all four test suites as organized groups.

### Run Specific Scenarios

```bash
# Run only smoke tests
run_smoke=true make test-load-signup

# Run smoke and average tests
run_smoke=true run_average=true make test-load-signup

# Skip spike test (run smoke, average, stress)
run_smoke=true run_average=true run_stress=true make test-load-signup
```

## Test Configuration

Configuration is managed in `tests/load/config.json.dist` under the `signup` endpoint section:

```bash
{
  "signup": {
    "host": "mockoon",
    "port": "8080",
    "setupTimeoutInMinutes": 10,
    "smoke": {
      "threshold": 8000,
      "rps": 3,
      "vus": 3,
      "maxVUs": 10,
      "duration": 10
    },
    "average": {
      "threshold": 5000,
      "rps": 10,
      "vus": 10,
      "maxVus": 30,
      "duration": { "rise": 5, "plateau": 30, "fall": 5 }
    },
    "stress": {
      "threshold": 12000,
      "rps": 50,
      "vus": 50,
      "maxVus": 150,
      "duration": { "rise": 5, "plateau": 30, "fall": 5 }
    },
    "spike": {
      "threshold": 25000,
      "rps": 100,
      "vus": 100,
      "maxVus": 300,
      "duration": { "rise": 30, "fall": 10 }
    }
  }
}
```

### Load Test Scenarios

| Scenario    | Duration | RPS | VUs | Max VUs | Purpose          |
| ----------- | -------- | --- | --- | ------- | ---------------- |
| **Smoke**   | 10s      | 3   | 3   | 10      | Quick validation |
| **Average** | 40s      | 10  | 10  | 30      | Typical load     |
| **Stress**  | 40s      | 50  | 50  | 150     | Breaking points  |
| **Spike**   | 40s      | 100 | 100 | 300     | Traffic surges   |

## Success Criteria

The tests use the following thresholds (defined in `utils/thresholdsBuilder.js`):

- **Response Time**: p99 < configured threshold (5-25 seconds depending on scenario)
- **Check Pass Rate**: > 95% of checks must pass (realistic for load testing)
- **Error Rate**: < 5% of requests can fail (allows for failures under extreme load)
- **Request Count**: At least 1 request must complete

These thresholds account for:

- Expected degradation under extreme load
- Network variability
- Server resource constraints
- Database connection limits

## Test Data Generation **[ENHANCED]**

The test suite uses `TEST_DATA_GENERATORS` from `utils/test-data.js`:

### Single User Generation

```bash
const user = TEST_DATA_GENERATORS.generateUser();
// Returns: { name, email, password }
```

### Batch User Generation **[NEW]**

```bash
const users = TEST_DATA_GENERATORS.generateUniqueUserBatch(5);
// Returns array of 5 unique users
// Each with guaranteed unique email, name, and password
```

**Benefits of batch generation:**

- Better test data isolation
- Prevents race conditions in parallel tests
- Ensures uniqueness across VUs and iterations

Each generated user has:

- **Unique email**: Based on VU, iteration, timestamp, index, and random string
- **Unique name**: Includes the same unique identifier
- **Secure password**: Random 8+ chars with uppercase, lowercase, numbers, and special characters

## Understanding Test Results

### Successful Test Output

```bash
✓ registration request completed with valid status
✓ success response has valid JSON body
✓ success response contains user ID
✓ password requirement validated: no uppercase/numbers/special
✓ integration: signup successful
✓ integration: login after signup

[INFO] Rate limiting not detected after 15 requests (3 succeeded, 12 rejected as duplicates)
[INFO] Bulk registration rate limiting detected and working correctly
```

### Key Metrics to Monitor

1. **Checks** - Percentage of validations that passed
   - Target: > 95%
   - Lower values indicate validation failures

2. **HTTP Request Failed Rate** - Percentage of failed HTTP requests
   - Target: < 5%
   - Higher values indicate server errors

3. **Iteration Duration** - Time to complete one full test iteration
   - Includes all test groups (positive, negative, rate limit, integration)
   - p95/p99 values show tail latency

4. **VUs** - Number of virtual users actively running tests
   - Should match configured scenario values
   - `Insufficient VUs` warning indicates need for higher `maxVus`

### Common Issues

**Issue**: `ERRO[XXXX] thresholds on metrics 'checks{scenario:X}' have been crossed`

- **Cause**: More than 5% of checks failed
- **Solutions**:
  - Check if server is healthy
  - Verify test data is valid
  - Review error logs for patterns
  - Consider if load is too high

**Issue**: `WARN[XXXX] Insufficient VUs, reached X active VUs and cannot initialize more`

- **Cause**: Not enough virtual users allocated for target RPS
- **Solution**: Increase `maxVus` in config for that scenario

**Issue**: High rate of 500 errors in spike scenario

- **Cause**: Server overwhelmed by extreme load (300 VUs)
- **Expected**: Some failures are acceptable at peak load
- **Action**: Verify error rate < 5% threshold

## Architecture Benefits

### Unified Execution

- ✅ **Single process**: All tests run in one k6 execution
- ✅ **Single report**: Consolidated HTML report with all results
- ✅ **Consistent config**: Same scenarios/thresholds across all tests
- ✅ **Better performance**: No Docker container restart overhead
- ✅ **Organized output**: Tests grouped by type in results

### Modular Files

- ✅ **Maintainability**: Each file focuses on one test type
- ✅ **Reusability**: Files can be run independently if needed
- ✅ **Clear separation**: Easy to understand test boundaries
- ✅ **Team collaboration**: Different developers can work on different files

## Extending the Tests

### Adding New Test Cases to Existing Files

**Example: Add to `negative.js`**

```bash
function testCustomValidation(utils, baseUrl, headers, params) {
  const payload = JSON.stringify({
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'invalidpassword',
  });

  const response = http.post(`${baseUrl}/api/users`, payload, {
    headers,
    ...params,
  });

  utils.checkResponse(response, 'custom validation test', (res) => res.status >= 400);
}

// Call it in runNegativeTests()
testCustomValidation(utils, baseUrl, headers, params);
```

### Adding New Integration Flows

**Example: Add to `integration.js`**

```bash
function testSignupEmailVerificationFlow(utils, baseUrl, headers, params) {
  // 1. Register user
  const user = TEST_DATA_GENERATORS.generateUser();
  const signupResponse = http.post(`${baseUrl}/api/users`, ...);

  // 2. Check email verification endpoint
  const verifyResponse = http.post(`${baseUrl}/api/auth/verify`, ...);

  // 3. Verify account activation
  utils.checkResponse(verifyResponse, 'account verified', ...);
}

// Call it in runIntegrationTests()
testSignupEmailVerificationFlow(utils, baseUrl, headers, params);
```

### Creating New Test File

1. Create `signup/newtest.js`
2. Export default function with test logic
3. Update `signup.js` to import and call it:

```bash
import runNewTests from './signup/newtest.js';

// In signup() function:
group('New Tests - Description', () => {
  runNewTests(utils, baseUrl, params);
});
```

## Best Practices

1. **Run tests against dedicated test environment**
   - Don't run against production
   - Use isolated database for test data

2. **Use appropriate test data generators**
   - Single users: `generateUser()`
   - Multiple users: `generateUniqueUserBatch(count)`
   - Ensures uniqueness and prevents conflicts

3. **Monitor server resources during tests**
   - CPU, memory, database connections
   - Identify bottlenecks

4. **Analyze trends over time**
   - Compare results across test runs
   - Track performance improvements/regressions

5. **Review logs after failures**
   - Check console output for `[INFO]` messages
   - Review server logs for errors

6. **Keep tests resilient to load**
   - Accept 4xx/5xx errors under extreme stress
   - Focus on overall pass rate (>95%)
   - Use informational logging for edge cases

## Troubleshooting

### Tests timing out

- Increase `setupTimeoutInMinutes` in config
- Reduce VUs or RPS for scenarios
- Check network connectivity

### Inconsistent results

- Database not being cleaned between runs
- Shared state between VUs
- Use `generateUniqueUserBatch()` for better isolation

### Rate limit tests always showing "not detected"

- This is **informational**, not a failure
- Tests document current behavior
- Consider implementing rate limiting if needed for production

### ESLint errors

```bash
CI=1 pnpm exec eslint tests/load/signup/
```

### Import errors

- Ensure paths use `../utils/` (parent directory)
- Check file extensions (`.js`)

## Test Results

All tests generate HTML reports in `tests/load/results/`:

- `signup.html` - Comprehensive report with all test groups

View the report by opening the HTML file in a browser after tests complete.

## Related Files

- `signup.js` - Main test orchestrator
- `signup/positive.js` - Valid registration tests
- `signup/negative.js` - Validation and security tests
- `signup/ratelimit.js` - Abuse protection tests
- `signup/integration.js` - End-to-end flow tests **[NEW]**
- `utils/test-data.js` - Test data generators **[ENHANCED]**
- `utils/thresholdsBuilder.js` - Success criteria
- `utils/scenarioUtils.js` - Scenario configuration
- `config.json.dist` - Test configuration

## Support

For issues or questions:

1. Check test output logs and `[INFO]` messages
2. Review this README
3. Consult k6 documentation: [k6 documentation](https://k6.io/docs/)
4. Check project issue tracker
