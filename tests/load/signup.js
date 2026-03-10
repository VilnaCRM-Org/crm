import { group, sleep } from 'k6';

import runIntegrationTests from './signup/integration.js';
import runNegativeTests from './signup/negative.js';
import runPositiveTests from './signup/positive.js';
import runRateLimitTests from './signup/ratelimit.js';
import ScenarioUtils from './utils/scenario-utils.js';
import Utils from './utils/utils.js';

const scenarioName = 'signup';

const utils = new Utils(scenarioName);
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

export default function signup() {
  const baseUrl = utils.getBaseUrl();
  const params = utils.getParams();

  group('Positive Tests - Registration Flow', () => {
    runPositiveTests(utils, baseUrl, params);
  });

  sleep(0.5);

  group('Negative Tests - Validation & Security', () => {
    runNegativeTests(utils, baseUrl, params);
  });

  sleep(0.5);

  if (__ITER === 0) {
    group('Rate Limit Tests - Abuse Protection', () => {
      runRateLimitTests(utils, baseUrl, params);
    });

    sleep(0.5);
  }

  group('Integration Tests - Signup API Behaviour', () => {
    runIntegrationTests(utils, baseUrl, params);
  });
}
