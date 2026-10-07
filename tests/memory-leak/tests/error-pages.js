const { t } = require('i18next');

const verifyPage = require('../utils/verify-page');
const ScenarioBuilder = require('../utils/scenario-builder');
const logger = require('../utils/logger');

const BASELINE_PATH = '/sign-in';
const TITLE_SELECTOR = 'h1#error-page-title';
const PAGE_TIMEOUT = 15000;
const BACK_TIMEOUT = 5000;

const ERROR_PAGES = [
  { path: '/forbidden', titleKey: 'error_page.forbidden.title' },
  { path: '/server-error', titleKey: 'error_page.server_error.title' },
  { path: '/__memlab_unknown_route__', titleKey: 'error_page.not_found.title' },
];

const scenarioBuilder = new ScenarioBuilder(BASELINE_PATH);

async function navigateInApp(page, targetPath) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
}

async function waitForErrorPageTitle(page, title) {
  const rendered = await page.waitForFunction(
    (selector, text) => document.querySelector(selector)?.textContent?.trim() === text,
    { timeout: PAGE_TIMEOUT },
    TITLE_SELECTOR,
    title
  );
  await rendered.dispose();
}

async function visitErrorPages(page, remaining) {
  const [current, ...rest] = remaining;
  if (!current) return;

  await navigateInApp(page, current.path);
  await waitForErrorPageTitle(page, t(current.titleKey));
  await verifyPage(page, current.path);
  await visitErrorPages(page, rest);
}

async function action(page) {
  try {
    await visitErrorPages(page, ERROR_PAGES);
  } catch (error) {
    logger.error(`❌ Error pages action failed: ${error.message}`);
    throw error;
  }
}

async function back(page) {
  try {
    await navigateInApp(page, BASELINE_PATH);

    const unmounted = await page.waitForFunction(
      (selector) => !document.querySelector(selector) && document.querySelector('form') !== null,
      { timeout: BACK_TIMEOUT },
      TITLE_SELECTOR
    );
    await unmounted.dispose();
    await verifyPage(page, BASELINE_PATH);
  } catch (error) {
    logger.error(`❌ Error pages back navigation failed: ${error.message}`);
    throw error;
  }
}

module.exports = scenarioBuilder.createScenario({ action, back });
