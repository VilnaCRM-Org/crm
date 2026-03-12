/* eslint-disable no-console */
import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

function parseJsonBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function isAcceptableStatus(res) {
  if ((res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)) {
    return true;
  }

  if (res.status >= 500) {
    console.error(
      `[ERROR] Server error during negative signup test: ${res.status} - ${(res.body || '').substring(0, 100)}`
    );
  }

  return false;
}

function containsRawXssMarker(value) {
  const normalizedValue = value.toLowerCase();

  return normalizedValue.includes('<script') || normalizedValue.includes('onerror=');
}

function buildRequestOptions(params) {
  return {
    ...params,
    headers: {
      'Content-Type': 'application/json',
      ...(params.headers || {}),
    },
  };
}

export default function runNegativeTests(utils, baseUrl, params) {
  if (!USE_REAL_BACKEND) {
    console.log(
      '[INFO] Running negative auth tests in mock mode. Payload-hardening checks only prove the server stays stable.'
    );
  }

  testSQLInjection(utils, baseUrl, params);
  testXSSAttempts(utils, baseUrl, params);
}

function testSQLInjection(utils, baseUrl, params) {
  const sqlInjectionPayloads = ["' OR '1'='1", "'; DROP TABLE users; --"];

  sqlInjectionPayloads.forEach((injection) => {
    const payload = JSON.stringify({
      fullName: 'Test User',
      email: `${injection}@example.com`,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

    utils.checkResponse(
      response,
      `SQL injection handled without server error: ${injection.substring(0, 20)}`,
      (res) => isAcceptableStatus(res)
    );

    if (response.status === 200 || response.status === 201) {
      const body = parseJsonBody(response.body);

      if (USE_REAL_BACKEND) {
        const message = typeof body?.message === 'string' ? body.message.toLowerCase() : '';
        const createdUser =
          body !== null &&
          typeof body === 'object' &&
          (body.id !== undefined ||
            message.includes('created') ||
            message.includes('registered') ||
            message.includes('success'));

        utils.checkResponse(response, 'SQL injection payload is rejected or neutralized', () => {
          if (body === null || typeof body !== 'object') {
            return false;
          }

          return !createdUser;
        });

        if (createdUser) {
          throw new Error(
            `SQL injection payload created a user instead of being rejected: ${(response.body || '').substring(0, 200)}`
          );
        }
      } else {
        console.log(
          `[INFO] Mock backend accepted SQL injection payload: ${injection.substring(0, 20)}`
        );
      }
    }
  });
}

function testXSSAttempts(utils, baseUrl, params) {
  const xssPayloads = ['<script>alert("XSS")</script>', '<img src=x onerror=alert("XSS")>'];

  xssPayloads.forEach((xss) => {
    const payload = JSON.stringify({
      fullName: xss,
      email: TEST_DATA_GENERATORS.generateUser().email,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

    utils.checkResponse(
      response,
      `XSS attempt handled without server error: ${xss.substring(0, 20)}...`,
      (res) => isAcceptableStatus(res)
    );

    if (!USE_REAL_BACKEND || (response.status !== 200 && response.status !== 201)) {
      return;
    }

    const body = parseJsonBody(response.body);
    let storedFullName = null;

    if (typeof body?.fullName === 'string') {
      storedFullName = body.fullName;
    } else if (typeof body?.user?.fullName === 'string') {
      storedFullName = body.user.fullName;
    }

    if (typeof storedFullName !== 'string') {
      throw new Error(
        `XSS attempt created a user but the response did not expose a verifiable fullName: ${(response.body || '').substring(0, 200)}`
      );
    }

    utils.checkResponse(response, `XSS payload sanitized before persistence: ${xss.substring(0, 20)}...`, () =>
      storedFullName !== xss && !containsRawXssMarker(storedFullName)
    );

    if (storedFullName === xss || containsRawXssMarker(storedFullName)) {
      throw new Error(`XSS payload was stored unsanitized: ${storedFullName}`);
    }
  });
}
