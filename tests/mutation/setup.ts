import 'reflect-metadata';
import '@testing-library/jest-dom';

import { seedFaker } from '@tests/builders/seed';

seedFaker();

const { testPath } = expect.getState();
const isIntegrationSuite = typeof testPath === 'string' && testPath.includes('/tests/integration/');

if (isIntegrationSuite) {
  require('../integration/setup');
} else if (!globalThis.fetch) {
  globalThis.fetch = (() =>
    Promise.reject(new Error('fetch is not implemented in this test environment'))) as typeof fetch;
}
