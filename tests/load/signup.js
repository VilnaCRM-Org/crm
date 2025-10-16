import { group, sleep } from 'k6';

import runPositiveTests from './signup/positive.js';
import runNegativeTests from './signup/negative.js';
import runRateLimitTests from './signup/ratelimit.js';
import ScenarioUtils from './utils/scenarioUtils.js';
import Utils from './utils/utils.js';

const scenarioName = 'signup';
const utils = new Utils(scenarioName);
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

// Export options from scenarioUtils (used for all test groups)
export const options = scenarioUtils.getOptions();

/**
 * Main test orchestrator that runs all signup test scenarios
 * This includes positive, negative, and rate limit tests
 */
export default function signup() {
  const baseUrl = utils.getBaseUrl();
  const params = utils.getParams();

  // Run positive tests (normal registration flow)
  group('Positive Tests - Normal Registration Flow', () => {
    runPositiveTests(utils, baseUrl, params);
  });

  // Small delay between test groups
  sleep(0.5);

  // Run negative tests (validation and security)
  group('Negative Tests - Validation & Security', () => {
    runNegativeTests(utils, baseUrl, params);
  });

  // Small delay between test groups
  sleep(0.5);

  // Run rate limit tests only on first iteration of each VU to avoid excessive requests
  // Rate limit tests make 100+ requests and would overwhelm the system if run every iteration
  if (__ITER === 0) {
    group('Rate Limit Tests - Abuse Protection', () => {
      runRateLimitTests(utils, baseUrl, params);
    });
  }
}
