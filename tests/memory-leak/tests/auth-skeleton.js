import ScenarioBuilder from '../utils/scenario-builder.js';

// Baseline is a non-matching route so no auth components are mounted.
// action() navigates to /authentication, triggering the AuthSkeleton → FormSection
// transition. back() returns to the baseline so MemLab can detect any objects
// retained from the skeleton's lifecycle.
const scenarioBuilder = new ScenarioBuilder('/__memlab_away__');

const authFormSelector = 'form, [role="form"]';

async function action(page) {
  try {
    await page.evaluate(() => {
      window.history.pushState({}, '', '/authentication');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for FormSection to finish loading (skeleton has come and gone).
    await page.waitForSelector(authFormSelector, { timeout: 15000 });
  } catch (error) {
    throw new Error(`Auth skeleton memory leak test failed: ${error.message}`);
  }
}

async function back(page) {
  try {
    await page.evaluate(() => {
      window.history.pushState({}, '', '/__memlab_away__');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await page.waitForFunction(
      () => !document.querySelector('form') && !document.querySelector('[role="form"]'),
      { timeout: 5000 }
    );
  } catch (error) {
    throw new Error(`Auth skeleton back navigation failed: ${error.message}`);
  }
}

export default scenarioBuilder.createScenario({ action, back });
