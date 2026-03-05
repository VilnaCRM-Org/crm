/* eslint-disable no-console */
import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

export default function runRateLimitTests(utils, baseUrl, params) {
  testRapidRequestsSameData(utils, baseUrl, params);

  sleep(1);

  testRapidRequestsDifferentData(utils, baseUrl, params);
}

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

  for (let i = 0; i < maxRequests; i += 1) {
    const response = http.post(`${baseUrl}/api/users`, payload, {
      headers,
      ...params,
    });

    if (response.status === 201 || response.status === 200) {
      successCount += 1;
    } else if (response.status === 422 || response.status === 400) {
      duplicateCount += 1;
    }

    if (i === 0) {
      utils.checkResponse(
        response,
        'first duplicate request processed',
        (res) =>
          res.status === 201 || res.status === 200 || res.status === 422 || res.status === 400
      );
    }

    if (response.status === 429) {
      rateLimitHit = true;

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

      break;
    }

    utils.checkResponse(response, 'rapid duplicate request handled without server error', (res) => {
      const validStatuses = [200, 201, 400, 409, 422, 429];
      if (validStatuses.includes(res.status)) {
        return true;
      }

      if (res.status >= 500 && res.status < 600) {
        console.error(
          `[ERROR] Server error during rate limit test: ${res.status} - ${res.body.substring(0, 100)}`
        );
        return false;
      }

      console.log(
        `[WARN] Unexpected status during rate limit test: ${res.status} - ${res.body.substring(0, 100)}`
      );
      return true;
    });
  }

  if (!rateLimitHit) {
    console.log(
      `[INFO] Rate limiting not detected after ${maxRequests} duplicate requests ` +
        `(${successCount} succeeded, ${duplicateCount} rejected as duplicates). ` +
        'Rate limiting may not be implemented or threshold not reached.'
    );
  } else {
    console.log('[INFO] Rate limiting detected and working correctly.');
  }
}

function testRapidRequestsDifferentData(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  let rateLimitHit = false;
  const maxRequests = 15;
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

    if (response.status === 201 || response.status === 200) {
      successCount += 1;
    } else if (response.status >= 400) {
      errorCount += 1;
    }

    if (response.status === 429) {
      rateLimitHit = true;
      break;
    }

    utils.checkResponse(response, 'bulk registration handled without server error', (res) => {
      if ((res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)) {
        return true;
      }

      if (res.status >= 500) {
        console.error(
          `[ERROR] Server error during bulk registration: ${res.status} - ${res.body.substring(0, 100)}`
        );
        return false;
      }

      return false;
    });
  }

  if (!rateLimitHit) {
    console.log(
      `[INFO] Rate limiting not detected for bulk registrations after ${maxRequests} requests ` +
        `(${successCount} succeeded, ${errorCount} errors). ` +
        'Consider implementing rate limiting per IP/session for production.'
    );
  } else {
    console.log('[INFO] Bulk registration rate limiting detected and working correctly.');
  }
}
