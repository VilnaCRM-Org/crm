const ScenarioBuilder = require('../utils/scenarioBuilder');

const scenarioBuilder = new ScenarioBuilder('/authentication');

const authSkeletonSelector = '[data-testid="auth-skeleton-title"]';
const authFormSelector = 'form, [role="form"]';

async function action(page) {
  try {
    // Skeleton is visible while the JS chunk loads
    await page.waitForSelector(authSkeletonSelector, { timeout: 8000 });

    // Wait for the form to fully replace the skeleton (skeleton unmounts)
    await page.waitForSelector(authFormSelector, { timeout: 15000 });
  } catch (error) {
    throw new Error(`Auth skeleton transition failed: ${error.message}`);
  }
}

module.exports = scenarioBuilder.createScenario({ action });
