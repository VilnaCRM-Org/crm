const path = require('node:path');

const { hasValidScenarioHooks } = require('./scenario-validation');

function loadScenarios(file) {
  const testModule = require(file);
  const scenarios = [];
  if (testModule && typeof testModule === 'object') {
    if (hasValidScenarioHooks(testModule)) {
      scenarios.push({ name: 'default', scenario: testModule });
    }
    for (const [name, scenario] of Object.entries(testModule)) {
      const isHook = ['url', 'action', 'back', 'setup'].includes(name);
      if (!isHook && hasValidScenarioHooks(scenario)) {
        scenarios.push({ name, scenario });
      }
    }
  }
  if (scenarios.length === 0) {
    throw new Error(`${path.basename(file)} exports no valid memory leak scenario.`);
  }
  return scenarios;
}

module.exports = { loadScenarios };
