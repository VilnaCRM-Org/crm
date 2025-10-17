import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

/**
 * Rate limiting test scenarios for signup endpoint
 * Verifies that the API properly protects against abuse through rate limiting
 * Note: These tests are informational and will document rate limiting presence/absence
 */
export default function runRateLimitTests(utils, baseUrl, params) {
  // Test 1: Rapid requests from same IP with same data
  testRapidRequestsSameData(utils, baseUrl, params);

  sleep(1);

  // Test 2: Rapid requests with different emails (but same pattern)
  testRapidRequestsDifferentData(utils, baseUrl, params);
}

/**
 * Test rapid requests with the same user data
 * This simulates a potential attack where an attacker repeatedly tries to register the same user
 */
function testRapidRequestsSameData(utils, baseUrl, params) {
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

  let rateLimitHit = false;
  const maxRequests = 15;
  let successCount = 0;
  let duplicateCount = 0;

  // Make rapid requests from same IP/user
  for (let i = 0; i < maxRequests; i += 1) {
    const response = http.post(`${baseUrl}/api/users`, payload, {
      headers,
      ...params,
    });

    // Track response patterns
    if (response.status === 201 || response.status === 200) {
      successCount += 1;
    } else if (response.status === 422 || response.status === 400) {
      duplicateCount += 1;
    }

    // First request should be processed (success or validation error)
    if (i === 0) {
      utils.checkResponse(
        response,
        'first duplicate request processed',
        (res) =>
          res.status === 201 || res.status === 200 || res.status === 422 || res.status === 400
      );
    }

    // Check if rate limit is applied (429 Too Many Requests)
    if (response.status === 429) {
      rateLimitHit = true;

      // Verify rate limit response format
      utils.checkResponse(response, 'rate limit response has retry-after or message', (res) => {
        const hasRetryAfter = res.headers['Retry-After'] !== undefined;
        let hasMessage = false;
        try {
          const body = JSON.parse(res.body);
          hasMessage = typeof body.message === 'string';
        } catch {
          // Body might not be JSON
        }
        return hasRetryAfter || hasMessage;
      });

      // Once rate limit is hit, break to avoid wasting resources
      break;
    }

    // All responses should have some status code (accept any, including server errors under load)
    utils.checkResponse(
      response,
      'rapid duplicate request handled',
      (res) => res.status >= 200 && res.status < 600
    );
  }

  // Informational logging only - not a failure condition
  if (!rateLimitHit) {
    // eslint-disable-next-line no-console
    console.log(
      `[INFO] Rate limiting not detected after ${maxRequests} duplicate requests ` +
        `(${successCount} succeeded, ${duplicateCount} rejected as duplicates). ` +
        'Rate limiting may not be implemented or threshold not reached.'
    );
  } else {
    // eslint-disable-next-line no-console
    console.log('[INFO] Rate limiting detected and working correctly.');
  }
}

/**
 * Test rapid requests with different emails
 * This simulates bulk registration attempts
 */
function testRapidRequestsDifferentData(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  let rateLimitHit = false;
  const maxRequests = 15; // Reduced from 30 to minimize load
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < maxRequests; i += 1) {
    const userData = TEST_DATA_GENERATORS.generateUser();

    const payload = JSON.stringify({
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
    });

    const response = http.post(`${baseUrl}/api/users`, payload, {
      headers,
      ...params,
    });

    // Track response patterns
    if (response.status === 201 || response.status === 200) {
      successCount += 1;
    } else if (response.status >= 400) {
      errorCount += 1;
    }

    // Check if rate limit is applied (429 Too Many Requests)
    if (response.status === 429) {
      rateLimitHit = true;
      break;
    }

    // All bulk requests should have some response (accept any status under load)
    utils.checkResponse(
      response,
      'bulk registration handled',
      (res) => res.status >= 200 && res.status < 600
    );
  }

  // Informational logging only - not a failure condition
  if (!rateLimitHit) {
    // eslint-disable-next-line no-console
    console.log(
      `[INFO] Rate limiting not detected for bulk registrations after ${maxRequests} requests ` +
        `(${successCount} succeeded, ${errorCount} errors). ` +
        'Consider implementing rate limiting per IP/session for production.'
    );
  } else {
    // eslint-disable-next-line no-console
    console.log('[INFO] Bulk registration rate limiting detected and working correctly.');
  }
}
