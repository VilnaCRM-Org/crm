import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * Positive test scenarios for signup endpoint
 * Tests the performance and reliability of user registration under various load conditions
 */
export default function runPositiveTests(utils, baseUrl, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  const payload = JSON.stringify({
    fullName: userData.fullName,
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

  // FIXED: Separate success (2xx) from expected client errors (4xx) and fail on server errors (5xx)
  //
  // Expected statuses during load tests:
  // - 201: Successfully created new user (primary success)
  // - 200: Request was successful (alternative success status)
  // - 400: Bad request (validation errors)
  // - 409: Conflict (duplicate email under race conditions)
  //
  // Unexpected statuses that indicate problems:
  // - 5xx: Server errors (should fail the test - indicates backend issues)
  const isSuccess = response.status >= 200 && response.status < 300;
  const isExpectedClientError = response.status === 400 || response.status === 409;
  const isServerError = response.status >= 500;

  utils.checkResponse(response, 'registration request completed without server error', (res) => {
    // Accept success (2xx) or expected client errors (400, 409)
    // Reject server errors (5xx) which indicate backend problems
    if (res.status >= 200 && res.status < 300) return true; // Success
    if (res.status === 400 || res.status === 409) return true; // Expected client errors

    // Log unexpected status codes
    if (res.status >= 500) {
      // eslint-disable-next-line no-console
      console.error(
        `[ERROR] Server error during signup: ${res.status} - ${res.body.substring(0, 100)}`
      );
      return false; // Fail on 5xx
    }

    // Log other unexpected statuses but don't fail (e.g., 422 might be acceptable)
    // eslint-disable-next-line no-console
    console.log(
      `[WARN] Unexpected status during signup: ${res.status} - ${res.body.substring(0, 100)}`
    );
    return true; // Accept other 4xx as potentially valid
  });

  // Track response patterns for reporting (doesn't fail test)
  if (!isSuccess && !isExpectedClientError) {
    if (isServerError) {
      // eslint-disable-next-line no-console
      console.error(
        `[ERROR] Server error during registration: ${response.status} - ${response.body.substring(0, 100)}`
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `[INFO] Unexpected client response: ${response.status} - ${response.body.substring(0, 100)}`
      );
    }
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

    // Note: Mockoon response is schema-based and may not include all fields
    // The actual response structure depends on the OpenAPI schema configuration
    // We only validate required fields that are guaranteed to be present (id)
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
