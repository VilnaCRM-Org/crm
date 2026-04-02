/* eslint-disable no-console */
import { group, sleep } from 'k6';

import runPositiveTests from './signup/positive.js';
import runNegativeTests from './signup/negative.js';
import runRateLimitTests from './signup/ratelimit.js';
import runIntegrationTests from './signup/integration.js';
import ScenarioUtils from './utils/scenarioUtils.js';
import Utils from './utils/utils.js';

const scenarioName = 'signup';
const utils = new Utils(scenarioName);
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

export default function signup() {
  const baseUrl = utils.getBaseUrl();
  const params = utils.getParams();
  const runGroup = (groupName, callback) => {
    group(groupName, () => {
      try {
        callback();
      } catch (error) {
        console.error(`[ERROR] ${groupName} failed`, error);
        throw error;
      }
    });
  };

  runGroup('Positive Tests - Normal Registration Flow', () => {
    runPositiveTests(utils, baseUrl, params);
  });

  sleep(0.5);

  runGroup('Negative Tests - Validation & Security', () => {
    runNegativeTests(utils, baseUrl, params);
  });

  sleep(0.5);

  if (__VU === 1 && __ITER === 0) {
    runGroup('Rate Limit Tests - Abuse Protection', () => {
      runRateLimitTests(utils, baseUrl, params);
    });
  }

  sleep(0.5);

  runGroup('Integration Tests - End-to-End Flows', () => {
    runIntegrationTests(utils, baseUrl, params);
  });
}
