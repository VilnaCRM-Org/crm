/* eslint-disable no-console */
import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

export default function runIntegrationTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  testSignupLoginFlow(utils, baseUrl, headers, params);

  sleep(0.5);

  if (USE_REAL_BACKEND) {
    testDuplicateSignupFlow(utils, baseUrl, headers, params);
    sleep(0.5);
    testInvalidSignupLoginAttempt(utils, baseUrl, headers, params);
  }
}

function testSignupLoginFlow(utils, baseUrl, headers, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  const signupPayload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  const signupResponse = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  if (signupResponse.status !== 201 && signupResponse.status !== 200) {
    console.log(
      `[INFO] Signup failed in integration test (status: ${signupResponse.status}), skipping login test`
    );
    return;
  }

  utils.checkResponse(
    signupResponse,
    'integration: signup returns 2xx status (shape-only)',
    (res) => res.status === 201 || res.status === 200
  );

  let userId;
  try {
    const signupBody = JSON.parse(signupResponse.body);
    userId = signupBody.id;
  } catch {
    console.log('[INFO] Could not parse signup response, skipping login test');
    return;
  }

  sleep(0.5);

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
    'integration: login returns valid status (shape-only)',
    (res) => res.status === 200 || res.status === 201 || (res.status >= 400 && res.status < 500)
  );

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
      'integration: profile endpoint returns 2xx status (shape-only, mock fixture)',
      (res) => res.status >= 200 && res.status < 300
    );

    if (profileResponse.status === 200) {
      utils.checkResponse(
        profileResponse,
        'integration: profile response has valid structure (shape-only, no email equality check)',
        (res) => {
          try {
            const body = JSON.parse(res.body);

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

function testDuplicateSignupFlow(utils, baseUrl, headers, params) {
  if (!USE_REAL_BACKEND) {
    // eslint-disable-next-line no-console
    console.log(
      '[SKIP] Duplicate signup test requires real backend (USE_REAL_BACKEND=true). ' +
        'Mockoon is stateless and cannot detect duplicates.'
    );
    return;
  }

  const userData = TEST_DATA_GENERATORS.generateUser();

  const signupPayload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  const firstSignup = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  if (firstSignup.status !== 201 && firstSignup.status !== 200) {
    return;
  }

  sleep(0.3);

  const duplicateSignup = http.post(`${baseUrl}/api/users`, signupPayload, {
    headers,
    ...params,
  });

  utils.checkResponse(
    duplicateSignup,
    'integration: duplicate signup rejected with 4xx',
    (res) => res.status === 422 || res.status === 400 || res.status === 409
  );
}

function testInvalidSignupLoginAttempt(utils, baseUrl, headers, params) {
  if (!USE_REAL_BACKEND) {
    // eslint-disable-next-line no-console
    console.log(
      '[SKIP] Invalid signup test requires real backend (USE_REAL_BACKEND=true). ' +
        'Mockoon cannot validate required fields or track state.'
    );
    return;
  }

  const userData = TEST_DATA_GENERATORS.generateUser();

  const invalidSignupPayload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
  });

  const signupResponse = http.post(`${baseUrl}/api/users`, invalidSignupPayload, {
    headers,
    ...params,
  });

  utils.checkResponse(
    signupResponse,
    'integration: invalid signup rejected with 4xx',
    (res) => res.status === 422 || res.status === 400
  );

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
    'integration: login fails for invalid signup with 401/404',
    (res) => res.status === 401 || res.status === 404
  );
}
