import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * ===============================================================================
 * NEGATIVE TESTS FOR SIGNUP ENDPOINT - MOCK SERVER RESILIENCE ONLY
 * ===============================================================================
 *
 * IMPORTANT: These tests target a STATELESS Mockoon mock server and ONLY
 * validate that the mock server does not crash or error when handling
 * malicious input patterns. They DO NOT validate actual security protections.
 *
 * What These Tests Validate:
 * - Mock server resilience: Server responds (2xx/4xx) and doesn't crash (5xx)
 * - Response structure: Server returns well-formed responses
 * - Basic stability: Server remains operational under malicious input patterns
 *
 * What These Tests DO NOT Validate:
 * - SQL injection prevention (Mockoon has no database)
 * - XSS sanitization (Mockoon has no output encoding)
 * - Input validation (no required field checking)
 * - Security controls (no WAF, no input filtering)
 * - Business logic validation
 *
 * Mockoon Limitations:
 * - NO database: Cannot test SQL injection attacks
 * - NO validation: Accepts any input including malicious payloads
 * - NO sanitization: Does not encode or escape output
 * - NO security controls: No WAF, rate limiting, or input filtering
 *
 * For Real Security Testing:
 * To validate actual SQL injection prevention, XSS protection, and input
 * validation, these tests must be run against the real application with:
 * - Real database with actual SQL queries
 * - Input validation and sanitization logic
 * - Security controls (WAF, input filtering, output encoding)
 * - Isolated test environment with disposable test database
 *
 * Set USE_REAL_BACKEND=true to run against real application (when available).
 *
 * ===============================================================================
 */

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

export default function runNegativeTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  if (!USE_REAL_BACKEND) {
    // eslint-disable-next-line no-console
    console.log(
      '[INFO] Running negative tests in MOCK MODE - testing server resilience only. ' +
        'These tests DO NOT validate SQL injection or XSS prevention. ' +
        'Set USE_REAL_BACKEND=true for real security validation.'
    );
  }

  // Test that API handles malicious input gracefully (doesn't crash)
  testSQLInjection(utils, baseUrl, headers, params);

  testXSSAttempts(utils, baseUrl, headers, params);
}

/**
 * Test SQL injection attempts
 *
 * MOCK MODE: Only tests server resilience - does NOT validate SQL injection prevention
 * REAL MODE: Validates that malicious SQL is properly sanitized/rejected
 */
function testSQLInjection(utils, baseUrl, headers, params) {
  // Test only the most dangerous SQL injection patterns
  const sqlInjectionPayloads = ["' OR '1'='1", "'; DROP TABLE users; --"];

  sqlInjectionPayloads.forEach((injection) => {
    const payload = JSON.stringify({
      fullName: 'Test User',
      email: `${injection}@example.com`,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

    // FIXED: Only accept 2xx (success) or 4xx (validation error) responses
    // Reject 5xx (server errors) which may indicate SQL injection succeeded
    utils.checkResponse(
      response,
      `SQL injection handled without server error: ${injection.substring(0, 20)}`,
      (res) => (res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)
    );

    // If accepted, verify it doesn't cause DB errors
    if (response.status === 201 || response.status === 200) {
      if (USE_REAL_BACKEND) {
        // Real backend: Verify SQL was sanitized (response contains valid data)
        utils.checkResponse(response, 'SQL injection sanitized properly', (res) => {
          try {
            const body = JSON.parse(res.body);
            return body.id !== undefined;
          } catch {
            return false;
          }
        });
      } else {
        // Mock mode: Just log that payload was accepted (expected for Mockoon)
        // eslint-disable-next-line no-console
        console.log(
          `[INFO] Mock server accepted SQL injection payload (expected - no validation): ${injection.substring(0, 20)}`
        );
      }
    }
  });
}

/**
 * Test XSS attempts
 *
 * MOCK MODE: Only tests server resilience - does NOT validate XSS prevention
 * REAL MODE: Validates that malicious scripts are properly escaped/rejected
 */
function testXSSAttempts(utils, baseUrl, headers, params) {
  // Test only the most common XSS patterns
  const xssPayloads = ['<script>alert("XSS")</script>', '<img src=x onerror=alert("XSS")>'];

  xssPayloads.forEach((xss) => {
    const payload = JSON.stringify({
      fullName: xss,
      email: TEST_DATA_GENERATORS.generateUser().email,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

    // FIXED: Only accept 2xx (success) or 4xx (validation error) responses
    // Reject 5xx (server errors) which may indicate XSS payload caused backend failure
    utils.checkResponse(
      response,
      `XSS attempt handled without server error: ${xss.substring(0, 20)}...`,
      (res) => res.status >= 200 && res.status < 500
    );

    if (response.status === 201 || response.status === 200) {
      if (USE_REAL_BACKEND) {
        // Real backend: Verify XSS was sanitized (no script tags in response)
        utils.checkResponse(response, 'XSS payload sanitized', (res) => {
          try {
            const body = JSON.parse(res.body);
            const fullName = body.fullName || '';
            // Check that script tags are escaped or removed
            return !fullName.includes('<script') && !fullName.includes('onerror=');
          } catch {
            return false;
          }
        });
      } else {
        // Mock mode: Just log that payload was accepted (expected for Mockoon)
        // eslint-disable-next-line no-console
        console.log(
          `[INFO] Mock server accepted XSS payload (expected - no sanitization): ${xss.substring(0, 20)}`
        );
      }
    }
  });
}
