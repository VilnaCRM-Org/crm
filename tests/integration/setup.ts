import 'reflect-metadata';

import { seedFaker } from '@tests/builders/seed';

seedFaker();

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
