import 'reflect-metadata';
import '@testing-library/react';

import { seedFaker } from '@tests/builders/seed';
import { installConsoleGate } from '@tests/console-gate/install';

seedFaker();
installConsoleGate();

const mockoonPort = process.env.MOCKOON_PORT || '8080';
process.env.REACT_APP_MOCKOON_URL = `http://localhost:${mockoonPort}`;

const server = (require('./mocks/server') as { default: typeof import('./mocks/server').default })
  .default;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
