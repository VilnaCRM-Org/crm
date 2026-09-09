import 'reflect-metadata';
import '@testing-library/jest-dom';
import '@testing-library/react';

import { seedFaker } from './tests/builders/seed';
import { installConsoleGate } from './tests/console-gate/install';

seedFaker();
installConsoleGate();

// jsdom does not provide a global fetch. Apollo Client's HttpLink requires one to
// exist at construction time; individual tests that exercise network code stub it.
if (!globalThis.fetch) {
  globalThis.fetch = (() =>
    Promise.reject(new Error('fetch is not implemented in this test environment'))) as typeof fetch;
}
