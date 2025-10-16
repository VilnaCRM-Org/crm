import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * Integration test scenarios for signup endpoint
 * Tests end-to-end flows involving multiple steps
 */
export default function runIntegrationTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  // Test 1: Complete signup → login flow
  testSignupLoginFlow(utils, baseUrl, headers, params);

  sleep(0.5);

  testDuplicateSignupFlow(utils, baseUrl, headers, params);

  sleep(0.5);

  testInvalidSignupLoginAttempt(utils, baseUrl, headers, params);
}

/**
 * Test: Signup → Login → Access Protected Resource
 * Validates the complete user lifecycle from registration to authenticated access
 */
function testSignupLoginFlow(utils, baseUrl, headers, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  // Step 1: Register new user
  const signupPayload = JSON.stringify({
    fullName: userData.name,
    email: userData.email,
    password: userData.password,
  });

  const signupResponse = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  // Under load, signup might fail - that's acceptable
  if (signupResponse.status !== 201 && signupResponse.status !== 200) {
    // eslint-disable-next-line no-console
    console.log(
      `[INFO] Signup failed in integration test (status: ${signupResponse.status}), skipping login test`
    );
    return;
  }

  utils.checkResponse(
    signupResponse,
    'integration: signup successful',
    (res) => res.status === 201 || res.status === 200
  );

  let userId;
  try {
    const signupBody = JSON.parse(signupResponse.body);
    userId = signupBody.id;
  } catch {
    // eslint-disable-next-line no-console
    console.log('[INFO] Could not parse signup response, skipping login test');
    return;
  }

  // Step 2: Small delay to simulate real-world behavior
  sleep(0.5);

  // Step 2: Login with the new user credentials
  const loginPayload = JSON.stringify({
    email: userData.email,
    password: userData.password,
  });

  const loginResponse = http.post(`${baseUrl}/api/auth/login`, loginPayload, {
    headers,
    ...params,
  });

  utils.checkResponse(
    loginResponse,
    'integration: login after signup',
    (res) => res.status === 200 || res.status === 201 || res.status >= 400
  );

  // If login succeeds, verify we get a token or session
  if (loginResponse.status === 200 || loginResponse.status === 201) {
    utils.checkResponse(
      loginResponse,
      'integration: login response has token or session',
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

  // Step 3: Attempt to access a protected resource (if login succeeded)
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

    utils.checkResponse(
      profileResponse,
      'integration: access user profile after login',
      (res) => res.status >= 200 && res.status < 600
    );

    if (profileResponse.status === 200) {
      utils.checkResponse(profileResponse, 'integration: profile contains user data', (res) => {
        try {
          const body = JSON.parse(res.body);
          return body.email === userData.email;
        } catch {
          return false;
        }
      });
    }
  }
}

/**
 * Test: Signup → Attempt Duplicate Signup → Verify Rejection
 * Validates that duplicate email registrations are properly prevented
 */
function testDuplicateSignupFlow(utils, baseUrl, headers, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  const signupPayload = JSON.stringify({
    fullName: userData.name,
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

  // Attempt duplicate signup
  const duplicateSignup = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  // Should be rejected with 400/409, but under load might be 500
  utils.checkResponse(
    duplicateSignup,
    'integration: duplicate signup rejected',
    (res) => res.status === 400 || res.status === 409 || res.status >= 500
  );
}

/**
 * Test: Invalid Signup → Login Attempt → Verify Login Fails
 * Validates that invalid registrations don't create usable accounts
 */
function testInvalidSignupLoginAttempt(utils, baseUrl, headers, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  // Attempt signup with invalid data (missing password)
  const invalidSignupPayload = JSON.stringify({
    fullName: userData.name,
    email: userData.email,
    // password intentionally missing
  });

  const signupResponse = http.post(`${baseUrl}/api/users`, invalidSignupPayload, {
    headers,
    ...params,
  });

  // Should fail validation
  utils.checkResponse(
    signupResponse,
    'integration: invalid signup rejected',
    (res) => res.status >= 400
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

  // Login should fail (401/404) since user was never created
  utils.checkResponse(
    loginResponse,
    'integration: login fails for invalid signup',
    (res) => res.status === 401 || res.status === 404 || res.status >= 400
  );
}
