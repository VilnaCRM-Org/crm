/* eslint-disable import/first */

import 'reflect-metadata';

const mockoonPort = process.env.MOCKOON_PORT || '8080';
process.env.REACT_APP_MOCKOON_URL = `http://localhost:${mockoonPort}`;

import fetch, { Headers, Request, Response } from 'node-fetch';

if (!global.fetch) global.fetch = fetch as unknown as typeof global.fetch;
if (!global.Headers) global.Headers = Headers as unknown as typeof global.Headers;
if (!global.Request) global.Request = Request as unknown as typeof global.Request;
if (!global.Response) global.Response = Response as unknown as typeof global.Response;

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
