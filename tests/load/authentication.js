import http from 'k6/http';

import ScenarioUtils from './utils/scenario-utils.js';
import Utils from './utils/utils.js';

const scenarioName = 'authentication';

const utils = new Utils();
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

export default function authentication() {
  const response = http.get(`${utils.getBaseUrl()}/authentication`, utils.getParams());

  utils.checkResponse(response, 'is status 200', (res) => res.status === 200);
}
