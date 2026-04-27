import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import LoginAPI from '@/modules/User/features/Auth/api/login-api';
import RegistrationAPI from '@/modules/User/features/Auth/api/registration-api';
import ApiStatusErrorFactory from '@/modules/User/features/Auth/api/api-status-error-factory';
import { loginReducer, loginUser, type LoginState } from '@/modules/User/store/login-slice';
import { registrationReducer, registerUser, type RegistrationState } from '@/modules/User/store/registration-slice';
import type { ThunkExtra } from '@/modules/User/store/types';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import { HttpError } from '@/services/HttpsClient/HttpError';
import FetchHttpsClient from '@/services/HttpsClient/fetch-https-client';
import HttpErrorResponseParser from '@/services/HttpsClient/http-error-response-parser';
import HttpErrorStatusGuard from '@/services/HttpsClient/http-error-status-guard';
import HttpResponseProcessor from '@/services/HttpsClient/http-response-processor';
import { DevToolsOptionsFactory } from '@/stores/dev-tools-options';
import deepRedact, { DevToolsRedactor } from '@/stores/dev-tools-redaction';

type LoginStore = {
  dispatch: ThunkDispatch<{ auth: LoginState }, ThunkExtra, UnknownAction>;
  getState: () => { auth: LoginState };
};

type RegistrationStore = {
  dispatch: ThunkDispatch<{ registration: RegistrationState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: RegistrationState };
};

const abortError = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });

describe('Integration Coverage Gaps', () => {
  it('uses injected dependencies when constructing auth-layer classes', async () => {
    const parsedError = { status: 401, message: 'Unauthorized' };
    const parser = { parseHttpError: jest.fn().mockReturnValue(parsedError) };
    const mapper = new AuthUiErrorMapper(parser as never);

    const uiError = mapper.map(new Error('ignored'));

    expect(parser.parseHttpError).toHaveBeenCalled();
    expect(uiError.displayMessage).toBeTruthy();
    expect(uiError.retryable).toBe(false);

    const httpsClient = {
      post: jest
        .fn()
        .mockResolvedValueOnce({ token: 'token-123' })
        .mockResolvedValueOnce({ fullName: 'Test User', email: 'user@test.com' }),
    };
    const apiErrorConverter = { convert: jest.fn() };
    const loginApi = new LoginAPI(httpsClient as never, apiErrorConverter as never);
    const registrationApi = new RegistrationAPI(httpsClient as never, apiErrorConverter as never);

    await expect(
      loginApi.login({ email: 'user@test.com', password: 'pass' })
    ).resolves.toEqual({ token: 'token-123' });
    await expect(
      registrationApi.register({
        email: 'user@test.com',
        password: 'pass',
        fullName: 'Test User',
      })
    ).resolves.toEqual({ fullName: 'Test User', email: 'user@test.com' });
  });

  it('rethrows abort errors from both auth thunks when the API aborts directly', async () => {
    const loginStore = configureStore({
      reducer: { auth: loginReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: {
              loginAPI: { login: jest.fn().mockRejectedValue(abortError) },
              registrationAPI: { register: jest.fn() },
            } satisfies ThunkExtra,
          },
        }),
    }) as LoginStore;

    const loginResult = await loginStore.dispatch(
      loginUser({ email: 'user@test.com', password: 'pass' })
    );

    expect(loginResult.type).toBe(loginUser.rejected.type);
    expect(loginResult.error.name).toBe('AbortError');

    const registrationStore = configureStore({
      reducer: { registration: registrationReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: {
              loginAPI: { login: jest.fn() },
              registrationAPI: { register: jest.fn().mockRejectedValue(abortError) },
            } satisfies ThunkExtra,
          },
        }),
    }) as RegistrationStore;

    const registrationResult = await registrationStore.dispatch(
      registerUser({
        email: 'user@test.com',
        password: 'pass',
        fullName: 'Test User',
      })
    );

    expect(registrationResult.type).toBe(registerUser.rejected.type);
    expect(registrationResult.error.name).toBe('AbortError');
  });

  it('handles explicit collaborators in HTTP helpers', async () => {
    const responseProcessor = { process: jest.fn().mockResolvedValue({ ok: true }) };
    const requestConfigBuilder = { create: jest.fn().mockReturnValue({ method: 'GET' }) };
    const transportErrorHandler = {
      throwAbortError: jest.fn(),
      rethrowOrWrap: jest.fn(),
    };
    const client = new FetchHttpsClient(
      requestConfigBuilder as never,
      responseProcessor as never,
      transportErrorHandler as never
    );
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ status: 200 } as Response);

    await expect(client.get('/health')).resolves.toEqual({ ok: true });
    expect(requestConfigBuilder.create).toHaveBeenCalledWith('GET', undefined, undefined);
    expect(responseProcessor.process).toHaveBeenCalled();
    global.fetch = originalFetch;

    const parser = { parse: jest.fn().mockResolvedValue({ message: 'Denied', body: 'body' }) };
    const guard = new HttpErrorStatusGuard(parser as never);

    await expect(
      guard.assertOk({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        url: '/secure',
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)
    ).rejects.toMatchObject({
      status: 401,
      message: 'Denied',
    });

    const statusGuard = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new HttpResponseProcessor(statusGuard as never);

    await expect(
      processor.process({
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ ok: true }),
        clone: () => ({
          text: jest.fn().mockResolvedValue('{"ok":true}'),
        }),
      } as unknown as Response)
    ).resolves.toEqual({ ok: true });
  });

  it('returns a safe fallback when parsing an error response throws unexpectedly', async () => {
    const parser = new HttpErrorResponseParser();

    await expect(
      parser.parse({
        headers: { get: () => 'application/json' },
        clone: () => {
          throw new Error('clone failed');
        },
      } as unknown as Response)
    ).resolves.toEqual({ message: null, body: undefined });
  });

  it('covers defensive branches in api status conversion', () => {
    const factory = new (ApiStatusErrorFactory as any)(
      { kind: 'service' },
      { status: 503, message: 'Service unavailable' },
      'Registration'
    );

    expect(factory.toSimpleApiError('unexpected-kind')).toBe('unexpected-kind');
  });

  it('uses injected redaction helpers and default exports', () => {
    const redactor = {
      deepRedact: jest.fn().mockImplementation((value: unknown) => ({ ...(value as object), token: '***' })),
    };
    const options = new DevToolsOptionsFactory(redactor as never).create();

    expect(options.stateSanitizer?.({ auth: { token: 'secret' } }, 0)).toEqual({
      auth: { token: '***' },
    });

    expect(deepRedact({ token: 'secret' })).toEqual({ token: '***' });

    const devToolsRedactor = new DevToolsRedactor();
    expect((devToolsRedactor as any).isPlainObject(null)).toBe(false);
  });

  it('constructs HttpError with parsed fallback data', async () => {
    const parser = { parse: jest.fn().mockResolvedValue({ message: null, body: 'problem' }) };
    const guard = new HttpErrorStatusGuard(parser as never);

    await expect(
      guard.assertOk({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        url: '/api/fail',
        headers: new Headers({ 'content-type': 'text/plain' }),
      } as Response)
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('covers metadata fallback branches when reflected constructor types are unavailable', () => {
    const importCases = [
      {
        modulePath: '@/modules/User/features/Auth/api/login-api',
        mockPath: '@/modules/User/features/Auth/api/api-error-converter',
        mockFactory: () => ({ __esModule: true, default: undefined }),
      },
      {
        modulePath: '@/modules/User/features/Auth/api/registration-api',
        mockPath: '@/modules/User/features/Auth/api/api-error-converter',
        mockFactory: () => ({ __esModule: true, default: undefined }),
      },
      {
        modulePath: '@/modules/User/store/auth-ui-error-mapper',
        mockPath: '@/utils/error/error-parser',
        mockFactory: () => ({ __esModule: true, default: undefined }),
      },
      {
        modulePath: '@/services/HttpsClient/fetch-https-client',
        mockPath: '@/services/HttpsClient/fetch-helpers',
        mockFactory: () => ({
          __esModule: true,
          HttpRequestConfigBuilder: undefined,
          HttpResponseProcessor: undefined,
          HttpTransportErrorHandler: undefined,
        }),
      },
      {
        modulePath: '@/services/HttpsClient/http-error-status-guard',
        mockPath: '@/services/HttpsClient/http-error-response-parser',
        mockFactory: () => ({ __esModule: true, default: undefined }),
      },
      {
        modulePath: '@/services/HttpsClient/http-response-processor',
        mockPath: '@/services/HttpsClient/http-error-status-guard',
        mockFactory: () => ({ __esModule: true, default: undefined }),
      },
    ];

    for (const { modulePath, mockPath, mockFactory } of importCases) {
      jest.isolateModules(() => {
        jest.doMock(mockPath, mockFactory);
        const imported = require(modulePath);
        expect(imported).toBeDefined();
        jest.dontMock(mockPath);
      });
    }

    jest.isolateModules(() => {
      jest.doMock('@/stores/dev-tools-redaction', () => ({
        __esModule: true,
        DevToolsRedactor: undefined,
        default: undefined,
      }));

      expect(() => require('@/stores/dev-tools-options')).toThrow('DevToolsRedactor is not a constructor');
      jest.dontMock('@/stores/dev-tools-redaction');
    });
  });
});
