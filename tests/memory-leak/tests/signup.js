const { t } = require('i18next');
const { faker } = require('@faker-js/faker');

const verifyPage = require('../utils/verify-page');
const ScenarioBuilder = require('../utils/scenario-builder');
const logger = require('../utils/logger');

const ROUTE_PATH = '/authentication';
const DEFAULT_TIMEOUT = 5000;
const NETWORK_IDLE_TIMEOUT = 30000;
const SIGNUP_SWITCHER_SELECTOR = '[data-testid="signup-switcher"]';
const PAGE_STATE_KEY = '__MEMLAB_SIGNUP_BASELINE__';

const scenarioBuilder = new ScenarioBuilder(ROUTE_PATH);

const createInputSelector = (placeholder) => `input[placeholder="${placeholder}"]`;

const getRegistrationSelectors = () => ({
  fullName: createInputSelector(t('sign_up.form.name_input.placeholder')),
  email: createInputSelector(t('sign_up.form.email_input.placeholder')),
  password: createInputSelector(t('sign_up.form.password_input.placeholder')),
});

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

  logger.debug('✓ Registration form detected (3+ inputs, has fullName field)');
}

async function waitForLoginForm(page, timeout = DEFAULT_TIMEOUT) {
  await page.waitForFunction(
    () => {
      const passwordInput = document.querySelector('input[name="password"]');
      const fullNameInput = document.querySelector('input[name="fullName"]');

      return passwordInput !== null && fullNameInput === null;
    },
    { timeout }
  );
}

async function ensureRegistrationForm(page) {
  const isRegistrationForm = await page.$('input[name="fullName"]');

  if (isRegistrationForm) {
    return false;
  }

  const switcherText = t('sign_up.form.switcher_text_no_account');
  const switcherByTestId = await page.$(SIGNUP_SWITCHER_SELECTOR);

  if (switcherByTestId) {
    await page.click(SIGNUP_SWITCHER_SELECTOR);
  } else {
    await page.waitForFunction(
      (text) =>
        Array.from(document.querySelectorAll('button')).some((button) =>
          button.textContent.trim().includes(text)
        ),
      { timeout: DEFAULT_TIMEOUT },
      switcherText
    );
    await page.evaluate((text) => {
      const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
        candidate.textContent.trim().includes(text)
      );
      if (button) {
        button.click();
      }
    }, switcherText);
  }

  await waitForRegistrationForm(page);

  return true;
}

async function restoreLoginView(page) {
  const switcherText = t('sign_up.form.switcher_text_have_account');
  const switcherByTestId = await page.$(SIGNUP_SWITCHER_SELECTOR);

  if (switcherByTestId) {
    await page.click(SIGNUP_SWITCHER_SELECTOR);
  } else {
    await page.waitForFunction(
      (text) =>
        Array.from(document.querySelectorAll('button')).some((button) =>
          button.textContent.trim().includes(text)
        ),
      { timeout: DEFAULT_TIMEOUT },
      switcherText
    );
    await page.evaluate((text) => {
      const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
        candidate.textContent.trim().includes(text)
      );
      if (button) {
        button.click();
      }
    }, switcherText);
  }

  await waitForLoginForm(page);
}

function generatePassword(length = 12) {
  const uppercase = faker.string.alpha({ length: 1, casing: 'upper' });
  const lowercase = faker.string.alpha({ length: 1, casing: 'lower' });
  const digit = faker.string.numeric(1);
  const remainingLength = Math.max(length - 3, 0);
  const remaining = faker.string.alphanumeric(remainingLength);
  const characters = `${uppercase}${lowercase}${digit}${remaining}`.split('');

  for (let i = characters.length - 1; i > 0; i -= 1) {
    const randomIndex = faker.number.int({ min: 0, max: i });
    [characters[i], characters[randomIndex]] = [characters[randomIndex], characters[i]];
  }

  return characters.join('');
}

const generateFakeUserData = () => ({
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  password: generatePassword(),
});

async function clearInputField(page, selector) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, selector);
}

async function fillFormFields(page, selectors, data) {
  const fields = Object.keys(selectors);
  for (const field of fields) {
    if (data[field] && selectors[field]) {
      await page.waitForSelector(selectors[field], { timeout: DEFAULT_TIMEOUT });
      await page.type(selectors[field], data[field]);
    }
  }
}

async function clearFormFields(page, selectors) {
  const fields = Object.keys(selectors);
  for (const field of fields) {
    if (selectors[field]) {
      try {
        await clearInputField(page, selectors[field]);
      } catch (error) {
        logger.warn(`⚠️ Failed to clear field ${field}: ${error.message}`);
        throw error;
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
    await page.evaluate((stateKey) => {
      const isRegistrationView = document.querySelector('input[name="fullName"]') !== null;
      window[stateKey] = {
        startedOnRegistration: isRegistrationView,
        registrationSwitched: false,
      };
    }, PAGE_STATE_KEY);
  } catch (error) {
    logger.error(`❌ Setup failed: ${error.message}`);
    throw error;
  }
}

async function action(page) {
  try {
    const registrationSwitched = await ensureRegistrationForm(page);
    await page.evaluate(
      ({ stateKey, registrationSwitched: switched }) => {
        const currentState = window[stateKey] || {
          startedOnRegistration: false,
          registrationSwitched: false,
        };

        window[stateKey] = {
          ...currentState,
          registrationSwitched: switched,
        };
      },
      { stateKey: PAGE_STATE_KEY, registrationSwitched }
    );
    const selectors = getRegistrationSelectors();
    const userData = generateFakeUserData();
    await fillFormFields(page, selectors, userData);
  } catch (error) {
    logger.error(`❌ Action failed: ${error.message}`);
    throw error;
  }
}

async function back(page) {
  try {
    const selectors = getRegistrationSelectors();
    await clearFormFields(page, selectors);
    const shouldRestoreLogin = await page.evaluate((stateKey) => {
      const state = window[stateKey];

      return Boolean(state) && !state.startedOnRegistration && state.registrationSwitched;
    }, PAGE_STATE_KEY);

    if (shouldRestoreLogin) {
      await restoreLoginView(page);
    }
  } catch (error) {
    logger.warn(`⚠️ Back function warning: ${error.message}`);
    throw error;
  }
}

async function completeRegistrationAction(page) {
  try {
    const registrationSwitched = await ensureRegistrationForm(page);
    await page.evaluate(
      ({ stateKey, registrationSwitched: switched }) => {
        const currentState = window[stateKey] || {
          startedOnRegistration: false,
          registrationSwitched: false,
        };

        window[stateKey] = {
          ...currentState,
          registrationSwitched: switched,
        };
      },
      { stateKey: PAGE_STATE_KEY, registrationSwitched }
    );

    const selectors = getRegistrationSelectors();
    const userData = generateFakeUserData();

    await fillFormFields(page, selectors, userData);

    await page.waitForFunction(
      () => {
        const inputs = document.querySelectorAll(
          'form input[type="text"], form input[type="email"], form input[type="password"]'
        );
        const filledInputs = Array.from(inputs).filter(
          (input) => input.value && input.value.length > 0
        );
        return filledInputs.length >= 3;
      },
      { timeout: DEFAULT_TIMEOUT }
    );
  } catch (error) {
    logger.error(`❌ Complete registration action failed: ${error.message}`);
    throw error;
  }
}

async function completeRegistrationBack(page) {
  try {
    const selectors = getRegistrationSelectors();
    await clearFormFields(page, selectors);
    const shouldRestoreLogin = await page.evaluate((stateKey) => {
      const state = window[stateKey];

      return Boolean(state) && !state.startedOnRegistration && state.registrationSwitched;
    }, PAGE_STATE_KEY);

    if (shouldRestoreLogin) {
      await restoreLoginView(page);
    }
  } catch (error) {
    logger.warn(`⚠️ Complete registration back warning: ${error.message}`);
    throw error;
  }
}

module.exports = scenarioBuilder.createScenario({ setup, action, back });

module.exports.completeRegistrationScenario = scenarioBuilder.createScenario({
  setup,
  action: completeRegistrationAction,
  back: completeRegistrationBack,
});
