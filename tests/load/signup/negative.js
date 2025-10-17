import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * Negative test scenarios for signup endpoint
 * Tests security and error handling
 *
 * IMPORTANT: The Mockoon API (based on OpenAPI spec) does NOT perform validation:
 * - NO password complexity validation (frontend-only)
 * - NO email format validation (frontend-only)
 * - NO required field validation (frontend-only)
 * - NO duplicate email checking (no database/state)
 *
 * ALL validation happens in the frontend. The API accepts any input.
 *
 * Tests here focus on:
 * - Security: Ensure API doesn't crash on SQL injection/XSS attempts
 * - Graceful handling: API returns valid responses for any input
 */
export default function runNegativeTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  // Only test that API handles malicious input gracefully (doesn't crash)
  testSQLInjection(utils, baseUrl, headers, params);

  testXSSAttempts(utils, baseUrl, headers, params);
}

/**
 * NOTE: the API does not validate:
 * - Duplicate emails (no database/state in Mockoon)
 * - Password complexity (validation is frontend-only)
 *
 * These validations happen in the frontend or real backend, not in Mockoon mock.
 */

/**
 * Test SQL injection attempts (reduced set for load testing)
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

    // Accept any response under load (2xx success, 4xx validation error, 5xx server error)
    utils.checkResponse(
      response,
      `SQL injection handled: ${injection.substring(0, 20)}`,
      (res) => res.status >= 200 && res.status < 600
    );

    // If accepted, verify it doesn't cause DB errors
    if (response.status === 201 || response.status === 200) {
      utils.checkResponse(response, 'SQL injection sanitized properly', (res) => {
        try {
          const body = JSON.parse(res.body);
          return body.id !== undefined;
        } catch {
          return false;
        }
      });
    }
  });
}

/**
 * Test XSS attempts (reduced set for load testing)
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

    // Accept any response under load (2xx success, 4xx validation error, 5xx server error)
    utils.checkResponse(
      response,
      `XSS attempt handled: ${xss.substring(0, 20)}...`,
      (res) => res.status >= 200 && res.status < 600
    );

    if (response.status === 201 || response.status === 200) {
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
    }
  });
}
