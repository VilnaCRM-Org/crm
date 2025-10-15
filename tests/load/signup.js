import http from 'k6/http';

import ScenarioUtils from './utils/scenarioUtils.js';
import TEST_DATA_GENERATORS from './utils/test-data.js';
import Utils from './utils/utils.js';

const scenarioName = 'signup-authentication';

const utils = new Utils(scenarioName);
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

/**
 * Main load test function for signup/registration endpoint
 * Tests the performance and reliability of user registration under various load conditions
 */
export default function signup() {
  const baseUrl = utils.getBaseUrl();
  const params = utils.getParams();

  const userData = TEST_DATA_GENERATORS.generateUser();

  const payload = JSON.stringify({
    fullName: userData.name,
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

  // Validate response status codes
  // 201: Successfully created new user
  // 200: Request was successful (alternative success status)
  // 400: Bad request (validation errors, duplicate email, etc.)
  // 500: Server error
  utils.checkResponse(
    response,
    'registration request completed',
    (res) => res.status === 201 || res.status === 200 || res.status === 400 || res.status === 500
  );

  utils.checkResponse(
    response,
    'successful registration (201 or 200)',
    (res) => res.status === 201 || res.status === 200
  );

  if (response.status === 201 || response.status === 200) {
    utils.checkResponse(response, 'response has valid JSON body', (res) => {
      try {
        const body = JSON.parse(res.body);
        return body !== null && typeof body === 'object';
      } catch {
        return false;
      }
    });
  }

  if (response.status >= 400) {
    // eslint-disable-next-line no-console
    console.warn(`Registration failed with status ${response.status}: ${response.body}`);
  }
}
