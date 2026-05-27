import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

export default function runNegativeTests(utils, baseUrl, params) {
  const headers = {
    ...params.headers,
    'Content-Type': 'application/json',
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
      fullName: injection,
      email: TEST_DATA_GENERATORS.generateUser().email,
      password: 'TestPassword123!',
    });

    const { headers: paramsHeaders, ...restParams } = params;
    const options = { ...restParams, headers: { ...(paramsHeaders || {}), ...headers } };
    const response = http.post(`${baseUrl}/api/users`, payload, options);

    utils.checkResponse(
      response,
      `SQL injection handled without server error: ${injection.substring(0, 20)}`,
      (res) => (res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)
    );

    if (response.status === 201 || response.status === 200) {
      if (USE_REAL_BACKEND) {
        utils.checkResponse(response, 'SQL injection response contains user id', (res) => {
          try {
            const body = JSON.parse(res.body);
            return !!body.id;
          } catch {
            return false;
          }
        });

        try {
          const body = JSON.parse(response.body);
          if (body.id) {
            const getResponse = http.get(`${baseUrl}/api/users/${body.id}`, options);
            utils.checkResponse(
              getResponse,
              `SQL injection: persisted fullName is sanitized (not raw payload): ${injection.substring(0, 20)}`,
              (res) => {
                try {
                  const user = JSON.parse(res.body);
                  return user.fullName !== injection;
                } catch {
                  return false;
                }
              }
            );
          }
        } catch {
          // body.id already validated by checkResponse above
        }
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

    const { headers: paramsHeaders, ...restParams } = params;
    const options = { ...restParams, headers: { ...(paramsHeaders || {}), ...headers } };
    const response = http.post(`${baseUrl}/api/users`, payload, options);

    utils.checkResponse(
      response,
      `XSS attempt handled without server error: ${xss.substring(0, 20)}...`,
      (res) => (res.status >= 200 && res.status < 300) || (res.status >= 400 && res.status < 500)
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
