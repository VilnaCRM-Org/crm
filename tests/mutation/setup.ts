import 'reflect-metadata';
import '@testing-library/jest-dom';
import '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

import { seedFaker } from '@tests/builders/seed';
import { installConsoleGate } from '@tests/console-gate/install';

seedFaker();
installConsoleGate();
expect.extend(toHaveNoViolations);

const { testPath } = expect.getState();
const isIntegrationSuite = typeof testPath === 'string' && testPath.includes('/tests/integration/');

if (isIntegrationSuite) {
  require('../integration/setup');
} else if (!globalThis.fetch) {
  globalThis.fetch = (() =>
    Promise.reject(new Error('fetch is not implemented in this test environment'))) as typeof fetch;
}
