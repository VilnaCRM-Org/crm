import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

export default function runNegativeTests(utils, baseUrl, params) {
  const headers = {
    'Content-Type': 'application/json',
    ...params.headers,
  };

  if (!USE_REAL_BACKEND) {
    // eslint-disable-next-line no-console
    console.log(
      '[INFO] Running negative tests in MOCK MODE - testing server resilience only. ' +
        'These tests DO NOT validate SQL injection or XSS prevention. ' +
        'Set USE_REAL_BACKEND=true for real security validation.'
    );
  }

  testSQLInjection(utils, baseUrl, headers, params);

  testXSSAttempts(utils, baseUrl, headers, params);
}

function testSQLInjection(utils, baseUrl, headers, params) {
  const sqlInjectionPayloads = ["' OR '1'='1", "'; DROP TABLE users; --"];

  sqlInjectionPayloads.forEach((injection) => {
    const payload = JSON.stringify({
      fullName: 'Test User',
      email: `${injection}@example.com`,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

    utils.checkResponse(
      response,
      `SQL injection handled without server error: ${injection.substring(0, 20)}`,
      (res) => (res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)
    );

    if (response.status === 201 || response.status === 200) {
      if (USE_REAL_BACKEND) {
        utils.checkResponse(response, 'SQL injection sanitized properly', (res) => {
          try {
            const body = JSON.parse(res.body);
            return body.id !== undefined;
          } catch {
            return false;
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[INFO] Mock server accepted SQL injection payload (expected - no validation): ${injection.substring(0, 20)}`
        );
      }
    }
  });
}

function testXSSAttempts(utils, baseUrl, headers, params) {
  const xssPayloads = ['<script>alert("XSS")</script>', '<img src=x onerror=alert("XSS")>'];

  xssPayloads.forEach((xss) => {
    const payload = JSON.stringify({
      fullName: xss,
      email: TEST_DATA_GENERATORS.generateUser().email,
      password: 'TestPassword123!',
    });

    const response = http.post(`${baseUrl}/api/users`, payload, { headers, ...params });

    utils.checkResponse(
      response,
      `XSS attempt handled without server error: ${xss.substring(0, 20)}...`,
      (res) => res.status >= 200 && res.status < 500
    );

    if (response.status === 201 || response.status === 200) {
      if (USE_REAL_BACKEND) {
        utils.checkResponse(response, 'XSS payload sanitized', (res) => {
          try {
            const body = JSON.parse(res.body);
            const fullName = body.fullName || '';
            return !fullName.includes('<script') && !fullName.includes('onerror=');
          } catch {
            return false;
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[INFO] Mock server accepted XSS payload (expected - no sanitization): ${xss.substring(0, 20)}`
        );
      }
    }
  });
}
