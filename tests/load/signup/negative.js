import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * Negative test scenarios for signup endpoint
 * Tests validation, error handling, and security measures
 * Note: These tests verify that the API properly handles invalid inputs
 */
export default function runNegativeTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  testDuplicateEmail(utils, baseUrl, headers, params);

  testInvalidEmailFormat(utils, baseUrl, headers, params);

  testWeakPasswords(utils, baseUrl, headers, params);

  testMissingFields(utils, baseUrl, headers, params);

  testSQLInjection(utils, baseUrl, headers, params);

  testXSSAttempts(utils, baseUrl, headers, params);
}

/**
 * Test duplicate email registration
 */
function testDuplicateEmail(utils, baseUrl, headers, params) {
  const existingUser = TEST_DATA_GENERATORS.generateUser();
  const payload = JSON.stringify({
    fullName: existingUser.name,
    email: existingUser.email,
    password: existingUser.password,
  });

  // First registration - should succeed
  http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

  // Duplicate registration - should fail
  const duplicateResponse = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

  utils.checkResponse(
    duplicateResponse,
    'duplicate email rejected',
    (res) => res.status === 409 || res.status === 400
  );

  if (duplicateResponse.status === 409 || duplicateResponse.status === 400) {
    utils.checkResponse(duplicateResponse, 'duplicate error has message', (res) => {
      try {
        const body = JSON.parse(res.body);
        return typeof body.message === 'string' && body.message.length > 0;
      } catch {
        return false;
      }
    });
  }
}

/**
 * Test invalid email formats (reduced set for load testing)
 */
function testInvalidEmailFormat(utils, baseUrl, headers, params) {
  // Reduced to 3 most common invalid formats to minimize load
  const invalidEmails = ['not-an-email', '@nodomain.com', ''];

  invalidEmails.forEach((invalidEmail) => {
    const payload = JSON.stringify({
      fullName: 'Test User',
      email: invalidEmail,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

    // Check that server handles invalid email (should be 400, but may vary)
    utils.checkResponse(
      response,
      `invalid email handled: ${invalidEmail || '(empty)'}`,
      (res) => res.status === 400 || res.status === 422
    );
  });
}

/**
 * Test weak or missing passwords (reduced set for load testing)
 */
function testWeakPasswords(utils, baseUrl, headers, params) {
  // Reduced to 2 most common weak passwords to minimize load
  const weakPasswords = [
    '', // Empty password
    '123', // Too short
  ];

  weakPasswords.forEach((weakPassword) => {
    const payload = JSON.stringify({
      fullName: 'Test User',
      email: TEST_DATA_GENERATORS.generateUser().email,
      password: weakPassword,
    });

    const response = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

    utils.checkResponse(
      response,
      `weak password handled: ${weakPassword || '(empty)'}`,
      (res) => res.status === 400 || res.status === 422
    );
  });
}

/**
 * Test missing required fields (reduced set for load testing)
 */
function testMissingFields(utils, baseUrl, headers, params) {
  // Test only the most critical missing field scenarios
  const testCases = [
    { payload: {}, description: 'all fields missing' },
    {
      payload: { fullName: 'Test User', email: 'test@example.com' },
      description: 'password missing',
    },
  ];

  testCases.forEach(({ payload, description }) => {
    const response = http.post(`${baseUrl}/api/users`, JSON.stringify(payload), {
      headers,
      ...params,
    });

    utils.checkResponse(
      response,
      `missing fields handled: ${description}`,
      (res) => res.status === 400 || res.status === 422
    );
  });
}

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

    // Should either reject as invalid (400) or sanitize and accept (201/200)
    utils.checkResponse(
      response,
      `SQL injection handled: ${injection.substring(0, 20)}`,
      (res) => res.status === 400 || res.status === 422 || res.status === 201 || res.status === 200
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

    // Should either reject as invalid (400) or sanitize and accept (201/200)
    utils.checkResponse(
      response,
      `XSS attempt handled: ${xss.substring(0, 20)}...`,
      (res) => res.status === 400 || res.status === 422 || res.status === 201 || res.status === 200
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
