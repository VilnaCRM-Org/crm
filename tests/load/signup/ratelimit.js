/* eslint-disable no-console */
import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

function buildRequestOptions(params) {
  return {
    ...params,
    headers: {
      'Content-Type': 'application/json',
      ...(params.headers || {}),
    },
  };
}

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

  let rateLimitHit = false;
  let successCount = 0;
  let duplicateCount = 0;
  const maxRequests = 15;

  for (let index = 0; index < maxRequests; index += 1) {
    const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

    if (response.status === 200 || response.status === 201) {
      successCount += 1;
    } else if (response.status === 400 || response.status === 409 || response.status === 422) {
      duplicateCount += 1;
    }

    utils.checkResponse(response, 'rapid duplicate request handled without server error', (res) => {
      const validStatuses = [200, 201, 400, 409, 422, 429];
      if (validStatuses.includes(res.status)) {
        return true;
      }

      if (res.status >= 500 && res.status < 600) {
        console.error(
          `[ERROR] Server error during rate limit test: ${res.status} - ${(res.body || '').substring(0, 100)}`
        );
        return false;
      }

      console.log(
        `[WARN] Unexpected status during rate limit test: ${res.status} - ${(res.body || '').substring(0, 100)}`
      );
      return false;
    });

    if (response.status === 429) {
      rateLimitHit = true;
      break;
    }
  }

  if (!rateLimitHit) {
    console.log(
      `[INFO] Rate limiting not detected after ${maxRequests} duplicate requests (${successCount} succeeded, ${duplicateCount} duplicate-style rejections).`
    );
  }
}

function testRapidRequestsDifferentData(utils, baseUrl, params) {
  const maxRequests = 15;
  let rateLimitHit = false;
  let successCount = 0;
  let errorCount = 0;

  for (let index = 0; index < maxRequests; index += 1) {
    const userData = TEST_DATA_GENERATORS.generateUser();
    const payload = JSON.stringify({
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
    });

    const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

    if (response.status === 200 || response.status === 201) {
      successCount += 1;
    } else if (response.status >= 400) {
      errorCount += 1;
    }

    utils.checkResponse(response, 'bulk registration handled without server error', (res) => {
      if ((res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)) {
        return true;
      }

      if (res.status >= 500) {
        console.error(
          `[ERROR] Server error during bulk registration: ${res.status} - ${(res.body || '').substring(0, 100)}`
        );
        return false;
      }

      return false;
    });

    if (response.status === 429) {
      rateLimitHit = true;
      break;
    }
  }

  if (!rateLimitHit) {
    console.log(
      `[INFO] Rate limiting not detected for bulk registrations after ${maxRequests} requests (${successCount} succeeded, ${errorCount} errors).`
    );
  }
}
