/* eslint-disable import/first */
// Must set up environment and fetch polyfill BEFORE any other imports
// This is intentional to ensure MSW can intercept fetch calls properly

import 'reflect-metadata';

// Set test environment variable for API base URL BEFORE any imports
// This ensures buildApiUrl constructs absolute URLs that MSW can intercept
const mockoonPort = process.env.MOCKOON_PORT || '8080';
process.env.REACT_APP_MOCKOON_URL = `http://localhost:${mockoonPort}`;

// Import node-fetch and set as global BEFORE any other imports
import fetch, { Headers, Request, Response } from 'node-fetch';

// Must set global.fetch before importing server or any code that uses fetch
if (!global.fetch) {
  global.fetch = fetch as unknown as typeof global.fetch;
  global.Headers = Headers as unknown as typeof global.Headers;
  global.Request = Request as unknown as typeof global.Request;
  global.Response = Response as unknown as typeof global.Response;
}

import server from './mocks/server';
/* eslint-enable import/first */

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
