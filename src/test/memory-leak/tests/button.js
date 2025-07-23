const ScenarioBuilder = require('../utils/ScenarioBuilder');

const scenarioBuilder = new ScenarioBuilder();

const signUpButtonSelector = 'button';

async function action(page) {
  await page.click(signUpButtonSelector);
}

module.exports = scenarioBuilder.createScenario({ action });
