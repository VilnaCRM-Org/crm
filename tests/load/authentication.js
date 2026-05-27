import http from 'k6/http';

import ScenarioUtils from './utils/scenarioUtils.js';
import Utils from './utils/utils.js';

const scenarioName = 'authentication';

const utils = new Utils();
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

export default function authentication() {
  const url = `${utils.getBaseUrl()}/${scenarioName}`;
  const response = http.get(url, utils.getParams());

  utils.checkResponse(response, 'is status 200', (res) => res.status === 200);
  utils.checkResponse(response, 'has non-empty body', (res) => res.body && res.body.length > 0);
}
