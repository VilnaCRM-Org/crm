import http from 'k6/http';

import ScenarioUtils from './utils/scenario-utils.js';
import Utils from './utils/utils.js';

const scenarioName = 'passwordRecovery';
const recoveryPaths = [
  '/password-recovery',
  '/password-reset?token=LoadTestResetToken00000000000001',
];

const utils = new Utils(scenarioName);
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

export default function passwordRecovery() {
  const baseUrl = utils.getBaseUrl();
  const params = utils.getParams();

  recoveryPaths.forEach((path) => {
    const page = path.split('?')[0];
    const response = http.get(`${baseUrl}${path}`, { ...params, tags: { page } });

    utils.checkResponse(response, `${page} is status 200`, (res) => res.status === 200);
  });
}
