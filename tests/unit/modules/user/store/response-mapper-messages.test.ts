import 'reflect-metadata';

import type LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import type RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import { buildEmail, buildRegistrationResponse, buildToken } from '@tests/builders';
import { assertError } from '@tests/utils/assert-result';

const INVALID_LOGIN_RESPONSE_MESSAGE = 'Unexpected response from server';

const INVALID_REGISTRATION_RESPONSE_MESSAGE =
  'There was a problem with the provided information. Please check your input.';

const REGISTRATION_VALIDATION_LOG = 'Registration response validation failed';

const loadLoginMapper = async (): Promise<LoginResponseMapper> => {
  const { default: Mapper } = await import('@/modules/user/store/login-response-mapper');

  return new Mapper();
};

const loadRegistrationMapper = async (): Promise<RegistrationResponseMapper> => {
  const { default: Mapper } = await import('@/modules/user/store/registration-response-mapper');

  return new Mapper();
};

describe('response mapper failure messages', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('pins the login failure message shown when the response is unparseable', async () => {
    const mapper = await loadLoginMapper();

    const result = mapper.map({ invalidField: 'value' }, buildEmail());

    assertError(result);
    expect(result.error.displayMessage).toBe(INVALID_LOGIN_RESPONSE_MESSAGE);
    expect(result.error.retryable).toBe(false);
  });

  it('pins the login failure message when the response is null', async () => {
    const mapper = await loadLoginMapper();

    const result = mapper.map(null, buildEmail());

    assertError(result);
    expect(result.error.displayMessage).toBe(INVALID_LOGIN_RESPONSE_MESSAGE);
  });

  it('never uses the failure message on a valid login response', async () => {
    const mapper = await loadLoginMapper();
    const token = buildToken();
    const email = buildEmail();

    const result = mapper.map({ token }, email.toUpperCase());

    expect(result).toEqual({ ok: true, value: { token, email } });
  });

  it('pins the registration failure message shown when the response is unparseable', async () => {
    const mapper = await loadRegistrationMapper();

    const result = mapper.map({ fullName: 123, email: 456 });

    assertError(result);
    expect(result.error.displayMessage).toBe(INVALID_REGISTRATION_RESPONSE_MESSAGE);
    expect(result.error.retryable).toBe(false);
  });

  it('logs the registration failure under a fixed label with the issue count', async () => {
    const mapper = await loadRegistrationMapper();

    mapper.map({ fullName: 123, email: 456 });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(REGISTRATION_VALIDATION_LOG, { issueCount: 2 });
  });

  it('reports a single issue when the whole registration payload is the wrong shape', async () => {
    const mapper = await loadRegistrationMapper();

    mapper.map(null);

    expect(consoleErrorSpy).toHaveBeenCalledWith(REGISTRATION_VALIDATION_LOG, { issueCount: 1 });
  });

  it('logs nothing and returns the payload on a valid registration response', async () => {
    const mapper = await loadRegistrationMapper();
    const response = buildRegistrationResponse();

    const result = mapper.map(response);

    expect(result).toEqual({ ok: true, value: response });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
