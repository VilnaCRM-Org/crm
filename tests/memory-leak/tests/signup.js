const { faker } = require('@faker-js/faker');
const { t } = require('i18next');

const ScenarioBuilder = require('../utils/scenario-builder');
const logger = require('../utils/logger');
const verifyPage = require('../utils/verify-page');

const ROUTE_PATH = '/authentication';
const DEFAULT_TIMEOUT = 5000;
const NETWORK_IDLE_TIMEOUT = 30000;

const scenarioBuilder = new ScenarioBuilder(ROUTE_PATH);

const createInputSelector = (placeholder) => `input[placeholder="${placeholder}"]`;

const getRegistrationSelectors = () => ({
  fullName: createInputSelector(t('sign_up.form.name_input.placeholder')),
  email: createInputSelector(t('sign_up.form.email_input.placeholder')),
  password: createInputSelector(t('sign_up.form.password_input.placeholder')),
});

const makeNamePart = () => faker.helpers.fromRegExp(/[A-Z][a-z]{4,7}/);

const generateFakeUserData = () => {
  const firstName = makeNamePart();
  const lastName = makeNamePart();

  return {
    fullName: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}.${Date.now()}@example.com`.toLowerCase(),
    password: 'TestPassword123!',
  };
};

async function waitForRegistrationForm(page, timeout = DEFAULT_TIMEOUT) {
  await page.waitForFunction(
    () => {
      const formInputs = document.querySelectorAll(
        'form input[type="text"], form input[type="email"], form input[type="password"]'
      );
      const fullNameInput = document.querySelector('input[name="fullName"]');

      return formInputs.length >= 3 && fullNameInput !== null;
    },
    { timeout }
  );
}

async function clearInputField(page, selector) {
  const input = await page.$(selector);
  if (!input) {
    return;
  }

  await input.click({ clickCount: 3 });
  await page.evaluate((selected) => {
    const element = document.querySelector(selected);
    if (element) {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector);
}

async function fillFormFields(page, selectors, data) {
  for (const field of Object.keys(selectors)) {
    if (data[field] && selectors[field]) {
      await page.waitForSelector(selectors[field], { timeout: DEFAULT_TIMEOUT });
      await page.type(selectors[field], data[field]);
    }
  }
}

async function clearFormFields(page, selectors) {
  for (const field of Object.keys(selectors)) {
    if (selectors[field]) {
      try {
        await clearInputField(page, selectors[field]);
      } catch (error) {
        logger.warn(`Failed to clear field ${field}: ${error.message}`);
      }
    }
  }
}

async function setup(page) {
  try {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await client.detach();

    const cookies = await page.cookies();
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
    }

    await page.goto(scenarioBuilder.url(), {
      waitUntil: 'networkidle0',
      timeout: NETWORK_IDLE_TIMEOUT,
    });

    await verifyPage(page, ROUTE_PATH);
  } catch (error) {
    logger.error('Auth memory leak setup failed', error);
    throw error;
  }
}

async function action(page) {
  try {
    const selectors = getRegistrationSelectors();
    const userData = generateFakeUserData();
    await fillFormFields(page, selectors, userData);
  } catch (error) {
    logger.error('Auth memory leak action failed', error);
    throw error;
  }
}

async function back(page) {
  const selectors = getRegistrationSelectors();
  await clearFormFields(page, selectors);
}

async function completeRegistrationAction(page) {
  const registrationForm = await page.$('input[name="fullName"]');

  if (!registrationForm) {
    const switcherText = t('sign_up.form.switcher_text_no_account');

    await page.waitForFunction(
      (text) =>
        Array.from(document.querySelectorAll('button')).some((button) =>
          button.textContent.trim().includes(text)
        ),
      { timeout: DEFAULT_TIMEOUT },
      switcherText
    );

    await page.evaluate((text) => {
      const switcher = Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent.trim().includes(text)
      );

      if (switcher) {
        switcher.click();
      }
    }, switcherText);

    await waitForRegistrationForm(page);
  }

  const selectors = getRegistrationSelectors();
  const userData = generateFakeUserData();

  await fillFormFields(page, selectors, userData);

  await page.waitForFunction(
    () => {
      const inputs = document.querySelectorAll(
        'form input[type="text"], form input[type="email"], form input[type="password"]'
      );

      const filledInputs = Array.from(inputs).filter((input) => input.value && input.value.length);
      return filledInputs.length >= 3;
    },
    { timeout: DEFAULT_TIMEOUT }
  );
}

async function completeRegistrationBack(page) {
  const selectors = getRegistrationSelectors();
  await clearFormFields(page, selectors);
}

module.exports = scenarioBuilder.createScenario({ setup, action, back });
module.exports.completeRegistrationScenario = scenarioBuilder.createScenario({
  setup,
  action: completeRegistrationAction,
  back: completeRegistrationBack,
});
