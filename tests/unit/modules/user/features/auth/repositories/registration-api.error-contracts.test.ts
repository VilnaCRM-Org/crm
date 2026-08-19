import { ApolloError } from '@apollo/client';

import { ApiError, ApiErrorCodes } from '@/modules/user/lib/api-errors';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import ApiErrorFactory from '@auth/repositories/api-error-factory';
import ApiStatusErrorFactory from '@auth/repositories/api-status-error-factory';
import RegistrationAPI from '@auth/repositories/registration-api';
import { buildUser } from '@tests/builders';

type ApolloClientLike = import('@apollo/client').ApolloClient<
  import('@apollo/client').NormalizedCacheObject
>;

const mockApollo = (mutate: jest.Mock): ApolloClientLike =>
  ({ mutate }) as unknown as ApolloClientLike;

const realFactory = (): ApiErrorFactory =>
  new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard());

const rejectionOf = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (error: unknown) => error
  );

describe('RegistrationAPI — error message contracts', () => {
  const credentials = buildUser();

  it('labels a converted transport failure with the Registration context', async () => {
    const mutate = jest.fn().mockRejectedValue(new Error('Something unexpected happened'));
    const api = new RegistrationAPI(mockApollo(mutate), realFactory());

    const rejection = await rejectionOf(api.register(credentials));

    expect(rejection).toBeInstanceOf(ApiError);
    expect((rejection as ApiError).code).toBe(ApiErrorCodes.UNKNOWN);
    expect((rejection as ApiError).message).toBe('Registration failed. Please try again.');
  });

  it('states the contract violation when the payload does not match the schema', async () => {
    const mutate = jest.fn().mockResolvedValue({ data: { createUser: { user: { id: 1 } } } });
    const api = new RegistrationAPI(mockApollo(mutate), realFactory());

    const rejection = await rejectionOf(api.register(credentials));

    expect(rejection).toBeInstanceOf(ApiError);
    expect((rejection as ApiError).code).toBe(ApiErrorCodes.VALIDATION);
    expect((rejection as ApiError).message).toBe(
      'Registration response did not match the expected contract.'
    );
  });

  it('normalizes an aborted request to a named AbortError carrying its own message', async () => {
    const controller = new AbortController();
    controller.abort();
    const mutate = jest.fn().mockRejectedValue(new Error('transport gave up'));
    const api = new RegistrationAPI(mockApollo(mutate), realFactory());

    const rejection = await rejectionOf(api.register(credentials, { signal: controller.signal }));

    expect(rejection).toBeInstanceOf(Error);
    expect((rejection as Error).name).toBe('AbortError');
    expect((rejection as Error).message).toBe('Registration request was aborted');
  });

  it('wraps a numeric transport status in a named HttpError', async () => {
    const apolloError = new ApolloError({
      networkError: Object.assign(new Error('Teapot'), { statusCode: 418 }),
    });
    const mutate = jest.fn().mockRejectedValue(apolloError);
    const api = new RegistrationAPI(mockApollo(mutate), realFactory());

    const rejection = (await rejectionOf(api.register(credentials))) as ApiError;

    expect(rejection).toBeInstanceOf(ApiError);
    expect(rejection.status).toBe(418);
    expect(rejection.message).toBe('Registration failed');
    expect(rejection.cause).toBeInstanceOf(HttpError);
    expect((rejection.cause as HttpError).message).toBe('Registration request failed');
    expect((rejection.cause as HttpError).status).toBe(418);
    expect((rejection.cause as HttpError).cause).toBe(apolloError);
  });

  it('keeps a non-numeric transport status out of the HttpError path (edge)', async () => {
    const apolloError = new ApolloError({
      networkError: Object.assign(new Error('Something unexpected happened'), {
        statusCode: '500',
      }),
    });
    const mutate = jest.fn().mockRejectedValue(apolloError);
    const api = new RegistrationAPI(mockApollo(mutate), realFactory());

    const rejection = (await rejectionOf(api.register(credentials))) as ApiError;

    expect(rejection.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(rejection.status).toBeUndefined();
    expect(rejection.cause).toBe(apolloError);
  });
});
