/* eslint-disable no-console */
import http from 'k6/http';
import { sleep } from 'k6';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

function describeResponse(response) {
  return `${response.status}: ${(response.body || '').substring(0, 200)}`;
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

export default function runIntegrationTests(utils, baseUrl, params) {
  testSignupFlow(utils, baseUrl, params);

  if (!USE_REAL_BACKEND) {
    console.log('[INFO] Skipping stateful auth integration checks in mock mode.');
    return;
  }

  sleep(0.5);
  testDuplicateSignupFlow(utils, baseUrl, params);
  sleep(0.5);
  testInvalidSignupAttempt(utils, baseUrl, params);
}

function testSignupFlow(utils, baseUrl, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();
  const payload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

  utils.checkResponse(response, 'integration: signup returns success', (res) =>
    res.status === 200 || res.status === 201
  );

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Initial signup failed during integration test: ${describeResponse(response)}`);
  }

  if (response.status === 200 || response.status === 201) {
    utils.checkResponse(response, 'integration: signup response is valid JSON', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body !== null && typeof body === 'object';
      } catch {
        return false;
      }
    });
  }
}

function testDuplicateSignupFlow(utils, baseUrl, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();
  const payload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  const firstSignup = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));
  if (firstSignup.status !== 200 && firstSignup.status !== 201) {
    throw new Error(`Initial signup failed before duplicate-check flow: ${describeResponse(firstSignup)}`);
  }

  const duplicateSignup = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

  utils.checkResponse(duplicateSignup, 'integration: duplicate signup rejected with 4xx', (res) =>
    res.status === 400 || res.status === 409 || res.status === 422
  );
}

function testInvalidSignupAttempt(utils, baseUrl, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();
  const payload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
  });

  const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

  utils.checkResponse(response, 'integration: invalid signup rejected with 4xx', (res) =>
    res.status === 400 || res.status === 422
  );
}
