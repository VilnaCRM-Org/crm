# Signup Load Tests

This directory contains all load tests related to the signup/registration functionality.

## File Structure

```bash
signup/
├── index.js        # Main orchestrator (runs all tests)
├── positive.js     # Happy path / normal registration tests
├── negative.js     # Validation, error handling, and security tests
└── ratelimit.js    # Rate limiting and abuse protection tests
```

## Files Overview

### index.js (Main Entry Point)

The main orchestrator that imports and runs all test scenarios in a single k6 execution. This provides:

- Organized test groups using k6's `group()` function
- Single HTML report with all test results
- Consistent scenario configuration across all tests
- Better performance than running separate scripts

### positive.js

Tests the normal user registration flow:

- Valid user data submission
- Successful registration (201/200)
- Response validation (user ID, email, JSON structure)
- Error handling for edge cases

### negative.js

Tests input validation and security measures:

- **Duplicate email** detection (409/400)
- **Invalid email formats** (6 patterns)
- **Weak passwords** (empty, short, no special chars)
- **Missing fields** (4 combinations)
- **SQL injection** attempts (5 attack vectors)
- **XSS attacks** (4 payload types)

### ratelimit.js

Tests API abuse protection:

- Rapid duplicate requests (same user data)
- Bulk registration attempts (different emails)
- Rate limit detection (429 status code)
- Rate limit response validation

## Running Tests

### Run All Tests (Recommended)

```bash
make test-load-signup
```

This runs `index.js` which executes all three test suites as organized groups.

### Run Individual Tests

```bash
make test-load-signup-positive    # Only positive tests
make test-load-signup-negative    # Only negative tests
make test-load-signup-ratelimit   # Only rate limit tests
```

## Test Results

All tests generate HTML reports in `tests/load/results/`:

- `signup.html` - Comprehensive report (all tests via index.js)
- `signup-positive.html` - Positive tests only
- `signup-negative.html` - Negative tests only
- `signup-ratelimit.html` - Rate limit tests only

## Configuration

Tests use the `signup` endpoint configuration from `tests/load/config.json`:

```bash
{
  "endpoints": {
    "signup": {
      "host": "mockoon",
      "port": "8080",
      "smoke": { "threshold": 8000, "rps": 3, "vus": 3, "duration": 10 },
      "average": { "threshold": 5000, "rps": 10, "vus": 10 },
      "stress": { "threshold": 12000, "rps": 50, "vus": 50 },
      "spike": { "threshold": 25000, "rps": 100, "vus": 100 }
    }
  }
}
```

## Architecture Benefits

### Single Entry Point (index.js)

- ✅ **Unified execution**: All tests run in one k6 process
- ✅ **Single report**: Consolidated HTML report with all results
- ✅ **Consistent config**: Same scenarios/thresholds across all tests
- ✅ **Better performance**: No Docker container restart overhead
- ✅ **Organized output**: Tests grouped by type in results

### Modular Files

- ✅ **Maintainability**: Each file focuses on one test type
- ✅ **Reusability**: Files can be run independently if needed
- ✅ **Clear separation**: Easy to understand test boundaries
- ✅ **Team collaboration**: Different team members can work on different files

## Adding New Tests

To add new signup test scenarios:

1. **For new test types**: Create a new file (e.g., `performance.js`)
2. **Update index.js**: Import and call the new test function
3. **Add Makefile target**: Add `test-load-signup-performance`
4. **Update documentation**: Document the new test suite

Example:

```bash
// In index.js
group('Performance Tests', () => {
  runPerformanceTests();
});

function runPerformanceTests() {
  // Your test code here
}
```

## Best Practices

1. **Use groups**: Wrap related tests in `group()` for better reporting
2. **Reuse utils**: Import from `../utils/` for common functionality
3. **Check responses**: Always use `utils.checkResponse()` for validation
4. **Add comments**: Document what each test validates
5. **Keep focused**: Each file should test one aspect (positive/negative/etc.)

## Troubleshooting

**ESLint errors**: Run `CI=1 pnpm exec eslint tests/load/signup/`
**Import errors**: Ensure paths use `../utils/` (parent directory)
**Scenario issues**: Check `config.json` for endpoint configuration
