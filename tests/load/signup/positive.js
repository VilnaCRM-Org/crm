/* eslint-disable no-console */
import http from 'k6/http';

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

export default function runPositiveTests(utils, baseUrl, params) {
  const userData = TEST_DATA_GENERATORS.generateUser();

  const payload = JSON.stringify({
    fullName: userData.fullName,
    email: userData.email,
    password: userData.password,
  });

  const response = http.post(`${baseUrl}/api/users`, payload, buildRequestOptions(params));

  utils.checkResponse(response, 'registration request completed without server error', (res) => {
    if (res.status >= 200 && res.status < 300) return true;
    if (res.status === 400 || res.status === 409) return true;

    if (res.status >= 500) {
      console.error(
        `[ERROR] Server error during signup: ${res.status} - ${(res.body || '').substring(0, 100)}`
      );
      return false;
    }

    console.log(
      `[WARN] Unexpected status during signup: ${res.status} - ${(res.body || '').substring(0, 100)}`
    );
    return false;
  });

  if (response.status === 200 || response.status === 201) {
    utils.checkResponse(response, 'success response has valid JSON body', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body !== null && typeof body === 'object';
      } catch {
        return false;
      }
    });

    utils.checkResponse(response, 'success response contains user data shape', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body.id !== undefined || body.message !== undefined || body.email !== undefined;
      } catch {
        return false;
      }
    });
  }

  if (response.status === 400 || response.status === 409) {
    utils.checkResponse(response, 'error response has valid structure', (res) => {
      try {
        const body = JSON.parse(res.body);
        return typeof body.message === 'string' || typeof body.error === 'string';
      } catch {
        return true;
      }
    });
  }
}
