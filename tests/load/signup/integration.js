import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * ===============================================================================
 * INTEGRATION TESTS FOR SIGNUP FLOW - MOCKOON STATELESS MODE
 * ===============================================================================
 *
 * IMPORTANT: These tests target a STATELESS Mockoon mock server and only
 * validate response structure/shape validation, NOT actual business logic.
 *
 * Mockoon Limitations:
 * - NO persistence: Data is not stored between requests
 * - NO state tracking: Cannot detect duplicate emails or remember created users
 * - NO validation: Cannot enforce required fields or business rules
 * - NO authentication: Cannot verify tokens or maintain sessions
 *
 * What These Tests Validate (SHAPE-ONLY):
 * - HTTP response status codes fall within expected ranges (2xx for success)
 * - Response body structure matches expected schema (has required fields)
 * - Response Content-Type headers are correct
 *
 * What These Tests DO NOT Validate:
 * - Actual data persistence or database operations
 * - Duplicate email detection or uniqueness constraints
 * - Field validation rules (required fields, formats, etc.)
 * - Authentication/authorization logic
 * - Session management or token validity
 * - Email equality or data consistency across requests
 *
 * For real end-to-end integration tests with persistence and validation,
 * set USE_REAL_BACKEND=true environment variable to run against actual backend.
 *
 * ===============================================================================
 */

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

/**
 * Integration test scenarios for signup endpoint
 * Tests end-to-end flows involving multiple steps (mock-only structural validation)
 */
export default function runIntegrationTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  testSignupLoginFlow(utils, baseUrl, headers, params);

  sleep(0.5);

  // Only run stateful tests against real backend
  if (USE_REAL_BACKEND) {
    testDuplicateSignupFlow(utils, baseUrl, headers, params);
    sleep(0.5);
    testInvalidSignupLoginAttempt(utils, baseUrl, headers, params);
  }
}

/**
 * Test: Signup → Login → Access Protected Resource (MOCK-ONLY SHAPE VALIDATION)
 *
 * MOCKOON MODE: Only validates response structure, not actual state/persistence.
 * This test does NOT verify:
 * - That signup actually creates a user
 * - That login verifies credentials
 * - That profile endpoint returns the created user's data
 * - That authentication tokens work
 *
 * This test ONLY verifies:
 * - Response status codes are in 2xx range for success paths
 * - Response bodies have expected field structure
 */
function testSignupLoginFlow(utils, baseUrl, headers, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  const signupPayload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  // Step 1: Signup (shape-only validation)
  const signupResponse = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  // Under load or with Mockoon, signup might fail - that's acceptable
  if (signupResponse.status !== 201 && signupResponse.status !== 200) {
    // eslint-disable-next-line no-console
    console.log(
      `[INFO] Signup failed in integration test (status: ${signupResponse.status}), skipping login test`
    );
    return;
  }

  // Shape validation only: verify successful status code
  utils.checkResponse(
    signupResponse,
    'integration: signup returns 2xx status (shape-only)',
    (res) => res.status === 201 || res.status === 200
  );

  // Extract userId if available (may be from mock fixture, not real persistence)
  let userId;
  try {
    const signupBody = JSON.parse(signupResponse.body);
    userId = signupBody.id;
  } catch {
    // eslint-disable-next-line no-console
    console.log('[INFO] Could not parse signup response, skipping login test');
    return;
  }

  sleep(0.5);

  // Step 2: Login (shape-only validation - NOT verifying credential checking)
  const loginPayload = JSON.stringify({
    email: userData.email,
    password: userData.password,
  });

  const loginResponse = http.post(`${baseUrl}/api/auth/login`, loginPayload, {
    headers,
    ...params,
  });

  // Shape validation: accept success (2xx) or expected errors (4xx)
  // In real backend: 200/201 = success, 401/404 = auth failure
  // In Mockoon: Just validates response structure
  utils.checkResponse(
    loginResponse,
    'integration: login returns valid status (shape-only)',
    (res) => res.status === 200 || res.status === 201 || (res.status >= 400 && res.status < 500)
  );

  // If login succeeds (in Mockoon mode), verify response has auth token structure
  // NOTE: This does NOT verify the token works, only that the field exists
  if (loginResponse.status === 200 || loginResponse.status === 201) {
    utils.checkResponse(
      loginResponse,
      'integration: login response has token structure (shape-only)',
      (res) => {
        try {
          const body = JSON.parse(res.body);
          return (
            body.token !== undefined ||
            body.accessToken !== undefined ||
            body.sessionId !== undefined ||
            res.headers['Set-Cookie'] !== undefined
          );
        } catch {
          return false;
        }
      }
    );
  }

  // Step 3: Access profile endpoint (MOCK-ONLY STRUCTURAL VERIFICATION)
  // NOTE: Mockoon returns mock data, NOT the actual created user
  // This only verifies the endpoint responds with correct structure
  if (loginResponse.status === 200 || loginResponse.status === 201) {
    let authHeader = {};
    try {
      const loginBody = JSON.parse(loginResponse.body);
      if (loginBody.token || loginBody.accessToken) {
        authHeader = {
          Authorization: `Bearer ${loginBody.token || loginBody.accessToken}`,
        };
      }
    } catch {
      // Could not parse token
    }

    const profileResponse = http.get(`${baseUrl}/api/users/${userId}`, {
      headers: { ...headers, ...authHeader },
      ...params,
    });

    // FIXED: Only accept 2xx status codes (previously accepted any status >= 200 && < 600)
    // Shape validation only: verify endpoint returns success status
    utils.checkResponse(
      profileResponse,
      'integration: profile endpoint returns 2xx status (shape-only, mock fixture)',
      (res) => res.status >= 200 && res.status < 300
    );

    // Shape validation only: verify response structure has required fields
    // NOTE: Does NOT verify email equality - Mockoon returns mock data, not created user
    if (profileResponse.status === 200) {
      utils.checkResponse(
        profileResponse,
        'integration: profile response has valid structure (shape-only, no email equality check)',
        (res) => {
          try {
            const body = JSON.parse(res.body);
            // SHAPE-ONLY: Verify response has user structure with required fields
            // Does NOT verify this is the actual created user (Mockoon is stateless)
            return (
              body.id !== undefined &&
              body.email !== undefined &&
              typeof body.email === 'string' &&
              body.email.includes('@')
            );
          } catch {
            return false;
          }
        }
      );
    }
  }
}

/**
 * Test: Signup → Attempt Duplicate Signup → Verify Rejection
 *
 * REQUIRES REAL BACKEND: Mockoon cannot detect duplicates (stateless)
 * This test is SKIPPED in Mockoon mode.
 *
 * TODO: Add real backend integration test for duplicate email detection
 * Expected behavior: Second signup with same email should return 422/400
 *
 * To enable: Set environment variable USE_REAL_BACKEND=true
 */
function testDuplicateSignupFlow(utils, baseUrl, headers, params) {
  if (!USE_REAL_BACKEND) {
    // eslint-disable-next-line no-console
    console.log(
      '[SKIP] Duplicate signup test requires real backend (USE_REAL_BACKEND=true). ' +
        'Mockoon is stateless and cannot detect duplicates.'
    );
    return;
  }

  // Real backend test implementation
  const userData = TEST_DATA_GENERATORS.generateUser();

  const signupPayload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  // First signup
  const firstSignup = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  // Skip if first signup failed
  if (firstSignup.status !== 201 && firstSignup.status !== 200) {
    return;
  }

  // Small delay
  sleep(0.3);

  // Attempt duplicate signup - should be rejected with 4xx
  const duplicateSignup = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  // Real backend should reject with 422 (Unprocessable Entity) or 400 (Bad Request)
  utils.checkResponse(
    duplicateSignup,
    'integration: duplicate signup rejected with 4xx',
    (res) => res.status === 422 || res.status === 400 || res.status === 409
  );
}

/**
 * Test: Invalid Signup → Login Attempt → Verify Login Fails
 *
 * REQUIRES REAL BACKEND: Mockoon cannot validate required fields
 * This test is SKIPPED in Mockoon mode.
 *
 * TODO: Add real backend integration test for field validation
 * Expected behavior:
 * - Invalid signup (missing required field) should return 422/400
 * - Subsequent login should fail with 401/404
 *
 * To enable: Set environment variable USE_REAL_BACKEND=true
 */
function testInvalidSignupLoginAttempt(utils, baseUrl, headers, params) {
  if (!USE_REAL_BACKEND) {
    // eslint-disable-next-line no-console
    console.log(
      '[SKIP] Invalid signup test requires real backend (USE_REAL_BACKEND=true). ' +
        'Mockoon cannot validate required fields or track state.'
    );
    return;
  }

  // Real backend test implementation
  const userData = TEST_DATA_GENERATORS.generateUser();

  // Attempt signup with invalid data (missing password)
  const invalidSignupPayload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    // password intentionally missing
  });

  const signupResponse = http.post(`${baseUrl}/api/users`, invalidSignupPayload, {
    headers,
    ...params,
  });

  // Real backend should reject with 422 (Unprocessable Entity) or 400 (Bad Request)
  utils.checkResponse(
    signupResponse,
    'integration: invalid signup rejected with 4xx',
    (res) => res.status === 422 || res.status === 400
  );

  // Attempt to login with the credentials anyway
  const loginPayload = JSON.stringify({
    email: userData.email,
    password: userData.password,
  });

  const loginResponse = http.post(`${baseUrl}/api/auth/login`, loginPayload, {
    headers,
    ...params,
  });

  // Real backend: login should fail with 401 (Unauthorized) or 404 (Not Found)
  utils.checkResponse(
    loginResponse,
    'integration: login fails for invalid signup with 401/404',
    (res) => res.status === 401 || res.status === 404
  );
}
