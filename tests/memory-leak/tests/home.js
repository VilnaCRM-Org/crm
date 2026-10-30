const { t } = require('i18next');

const verifyPage = require('../utils/verify-page');
const ScenarioBuilder = require('../utils/scenario-builder');
const logger = require('../utils/logger');

const AWAY_PATH = '/__memlab_away__';
const HOME_PATH = '/';
const HOME_TIMEOUT = 15000;
const BACK_TIMEOUT = 5000;

const scenarioBuilder = new ScenarioBuilder(AWAY_PATH);

async function navigateInApp(page, targetPath) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
}

async function waitForHomeOrRedirect(page, heading) {
  const settled = await page.waitForFunction(
    (homePath, text) =>
      window.location.pathname !== homePath ||
      [...document.querySelectorAll('main h1')].some((h1) => h1.textContent?.trim() === text),
    { timeout: HOME_TIMEOUT },
    HOME_PATH,
    heading
  );
  await settled.dispose();
}

async function waitForHomeHeading(page, heading) {
  const rendered = await page.waitForFunction(
    (text) =>
      [...document.querySelectorAll('main h1')].some((h1) => h1.textContent?.trim() === text),
    { timeout: HOME_TIMEOUT },
    heading
  );
  await rendered.dispose();
}

async function action(page) {
  try {
    const heading = t('home.heading');

    await navigateInApp(page, HOME_PATH);
    await waitForHomeOrRedirect(page, heading);
    await verifyPage(page, HOME_PATH);
    await waitForHomeHeading(page, heading);
  } catch (error) {
    logger.error(`❌ Home action failed: ${error.message}`);
    throw error;
  }
}

async function back(page) {
  try {
    const heading = t('home.heading');

    await navigateInApp(page, AWAY_PATH);

    const unmounted = await page.waitForFunction(
      (text) => ![...document.querySelectorAll('h1')].some((h1) => h1.textContent?.trim() === text),
      { timeout: BACK_TIMEOUT },
      heading
    );
    await unmounted.dispose();
    await verifyPage(page, AWAY_PATH);
  } catch (error) {
    logger.error(`❌ Home back navigation failed: ${error.message}`);
    throw error;
  }
}

module.exports = scenarioBuilder.createScenario({ action, back });
