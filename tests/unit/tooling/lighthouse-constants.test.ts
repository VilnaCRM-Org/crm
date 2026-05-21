// @jest-environment node

import path from 'path';

const constantsModulePath = path.resolve(__dirname, '..', '..', '..', 'lighthouse/constants.js');

describe('lighthouse constants', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();

    delete process.env.LHCI_TARGET_URL;
    delete process.env.REACT_APP_PROD_CONTAINER_API_URL;
    delete process.env.REACT_APP_PROD_HOST_API_URL;
    delete process.env.PROD_HOST;
    delete process.env.PROD_PORT;
    delete process.env.WEBSITE_DOMAIN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('expands the base URL from the repo env file into the protected and auth Lighthouse pages', () => {
    const { pages } = jest.requireActual<{ pages: string[] }>(constantsModulePath);

    expect(pages).toEqual(['http://prod:3001', 'http://prod:3001/authentication']);
  });
});
