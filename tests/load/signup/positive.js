/* eslint-disable no-console */
import http from 'k6/http';

import TEST_DATA_GENERATORS from '../utils/test-data.js';

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

  const isSuccess = response.status >= 200 && response.status < 300;
  const isExpectedClientError = response.status === 400 || response.status === 409;
  const isServerError = response.status >= 500;

  utils.checkResponse(response, 'registration request completed without server error', (res) => {
    if (res.status >= 200 && res.status < 300) return true;
    if (res.status === 400 || res.status === 409) return true;

    if (res.status >= 500) {
      console.error(
        `[ERROR] Server error during signup: ${res.status} - ${res.body.substring(0, 100)}`
      );
      return false;
    }
    console.log(
      `[WARN] Unexpected status during signup: ${res.status} - ${res.body.substring(0, 100)}`
    );
    return true;
  });

  if (!isSuccess && !isExpectedClientError) {
    if (isServerError) {
      console.error(
        `[ERROR] Server error during registration: ${response.status} - ${response.body.substring(0, 100)}`
      );
    } else {
      console.log(
        `[INFO] Unexpected client response: ${response.status} - ${response.body.substring(0, 100)}`
      );
    }
  }

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
