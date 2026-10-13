import http from 'k6/http';

import ScenarioUtils from './utils/scenario-utils.js';
import Utils from './utils/utils.js';

const scenarioName = 'errorPages';
const errorPagePaths = ['/forbidden', '/server-error', '/definitely-not-a-route'];

const utils = new Utils(scenarioName);
const scenarioUtils = new ScenarioUtils(utils, scenarioName);

export const options = scenarioUtils.getOptions();

export default function errorPages() {
  const baseUrl = utils.getBaseUrl();
  const params = utils.getParams();

  errorPagePaths.forEach((path) => {
    const response = http.get(`${baseUrl}${path}`, { ...params, tags: { page: path } });

    utils.checkResponse(response, `${path} is status 200`, (res) => res.status === 200);
  });
}
