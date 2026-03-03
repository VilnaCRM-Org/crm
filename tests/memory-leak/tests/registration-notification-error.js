import ScenarioBuilder from '../utils/scenario-builder.js';

import {
  createRegistrationFormData,
  fillRegistrationForm,
  isGraphqlRequest,
  navigateHome,
  openAuthForm,
  registrationCorsHeaders,
  registrationNotificationSelectors,
  submitRegistrationForm,
  waitForNotificationButtonCount,
  clickNotificationButton,
} from '../utils/registration-notification-helpers.js';

const scenarioBuilder = new ScenarioBuilder();
const formData = createRegistrationFormData('memlab.error');

async function submitWithErrorResponse(page) {
  await page.setRequestInterception(true);
  let interceptedGraphqlRequests = 0;

  const requestHandler = async (request) => {
    if (!isGraphqlRequest(request)) {
      await request.continue();
      return;
    }
    interceptedGraphqlRequests += 1;
    if (request.method() === 'OPTIONS') {
      await request.respond({
        status: 204,
        headers: registrationCorsHeaders,
      });
      return;
    }

    await request.respond({
      status: 500,
      headers: { ...registrationCorsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errors: [
          {
            message: 'temporary backend error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          },
        ],
      }),
    });
  };

  page.on('request', requestHandler);
  try {
    await submitRegistrationForm(page);
    const alertButtonCount = await waitForNotificationButtonCount(page);

    if (interceptedGraphqlRequests < 1) {
      throw new Error('No GraphQL requests were intercepted during error submission');
    }

    if (alertButtonCount !== 2) {
      throw new Error(
        `Expected error notification with 2 buttons, received ${alertButtonCount} button(s)`
      );
    }
  } finally {
    page.off('request', requestHandler);
    await page.setRequestInterception(false);
  }
}

async function action(page) {
  try {
    await openAuthForm(page);
    await fillRegistrationForm(page, formData);
    await submitWithErrorResponse(page);
  } catch (error) {
    throw new Error(`Registration error transition failed: ${error.message}`);
  }
}

async function back(page) {
  try {
    await clickNotificationButton(page, 1);
    await page.waitForSelector(registrationNotificationSelectors.fullNameInput, {
      timeout: 15000,
    });
    await navigateHome(page);
  } catch (error) {
    throw new Error(`Registration error cleanup failed: ${error.message}`);
  }
}

export default scenarioBuilder.createScenario({ action, back });
