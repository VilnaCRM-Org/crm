/* eslint-disable no-console */
import http from 'k6/http';

import { hasSuccessfulSignupBody } from './responseAssertions.js';
import TEST_DATA_GENERATORS from '../utils/test-data.js';

const USE_REAL_BACKEND = __ENV.USE_REAL_BACKEND === 'true';

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

  utils.checkResponse(response, 'registration request completed without server error', (res) => {
    if (res.status === 200 || res.status === 201) return true;

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
        return hasSuccessfulSignupBody(body, userData.email, USE_REAL_BACKEND);
      } catch {
        return false;
      }
    });
  }
}
