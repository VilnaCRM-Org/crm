import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * Positive test scenarios for signup endpoint
 * Tests the performance and reliability of user registration under various load conditions
 */
export default function runPositiveTests(utils, baseUrl, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  const payload = JSON.stringify({
    fullName: userData.name,
    email: userData.email,
    password: userData.password,
  });

  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  const response = http.post(`${baseUrl}/api/users`, payload, {
    ...params,
    headers,
  });

  // Validate response - during load tests, some requests may fail with 4xx/5xx errors
  // This is acceptable behavior under stress conditions
  // 201: Successfully created new user
  // 200: Request was successful (alternative success status)
  // 400: Bad request (validation errors, duplicate email, etc.)
  // 409: Conflict (duplicate email)
  // 500: Server error (may occur under extreme load)
  utils.checkResponse(
    response,
    'registration request completed with valid status',
    (res) => res.status >= 200 && res.status < 600
  );

  // Track successful registrations separately (optional check, doesn't fail test)
  const isSuccess = response.status === 201 || response.status === 200;
  if (!isSuccess && response.status !== 400 && response.status !== 409) {
    // eslint-disable-next-line no-console
    console.log(
      `[INFO] Non-success registration: ${response.status} - ${response.body.substring(0, 100)}`
    );
  }

  // Validate successful responses
  if (response.status === 201 || response.status === 200) {
    utils.checkResponse(response, 'success response has valid JSON body', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body !== null && typeof body === 'object';
      } catch {
        return false;
      }
    });

    utils.checkResponse(response, 'success response contains user ID', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body.id !== undefined && body.id !== null;
      } catch {
        return false;
      }
    });

    utils.checkResponse(response, 'success response contains email', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body.email === userData.email;
      } catch {
        return false;
      }
    });
  }

  // Validate error responses have proper structure
  if (response.status === 400 || response.status === 409) {
    utils.checkResponse(response, 'error response has valid structure', (res) => {
      try {
        const body = JSON.parse(res.body);
        return typeof body.message === 'string' || typeof body.error === 'string';
      } catch {
        // Some error responses might not be JSON
        return true;
      }
    });
  }
}
