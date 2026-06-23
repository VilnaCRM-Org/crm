import { ApolloError } from '@apollo/client';

import { ApiError, ConflictError } from '@/modules/user/lib/api-errors';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import ApiErrorFactory from '@auth/repositories/api-error-factory';
import ApiStatusErrorFactory from '@auth/repositories/api-status-error-factory';
import CREATE_USER from '@auth/repositories/create-user-mutation';
import RegistrationAPI from '@auth/repositories/registration-api';

type ApolloClient = import('@apollo/client').ApolloClient<
  import('@apollo/client').NormalizedCacheObject
>;

const mockApollo = (mutate: jest.Mock): ApolloClient => ({ mutate }) as unknown as ApolloClient;

describe('RegistrationAPI', () => {
  const credentials = {
    email: 'user@example.com',
    password: 'secret',
    fullName: 'Test User',
  };

  const userPayload = {
    id: 'user-1',
    confirmed: true,
    email: credentials.email,
    initials: credentials.fullName,
  };

  it('creates the user through the GraphQL mutation and maps the payload', async () => {
    const mutate = jest.fn().mockResolvedValue({
      data: { createUser: { user: userPayload, clientMutationId: 'cid' } },
    });
    const api = new RegistrationAPI(mockApollo(mutate), { convert: jest.fn() } as never);

    await expect(api.register(credentials)).resolves.toEqual({
      email: credentials.email,
      fullName: credentials.fullName,
    });
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: CREATE_USER,
        variables: {
          input: {
            email: credentials.email,
            initials: credentials.fullName,
            password: credentials.password,
            clientMutationId: expect.any(String),
          },
        },
        context: { fetchOptions: { signal: undefined } },
      })
    );
  });

  it('returns undefined when the mutation yields no user', async () => {
    const mutate = jest.fn().mockResolvedValue({ data: null });
    const api = new RegistrationAPI(mockApollo(mutate), { convert: jest.fn() } as never);

    await expect(api.register(credentials)).resolves.toBeUndefined();
  });

  it('forwards the abort signal and throws an AbortError without converting on abort', async () => {
    const controller = new AbortController();
    controller.abort();
    const mutate = jest.fn().mockRejectedValue(new Error('network failure mid-flight'));
    const converter = { convert: jest.fn() };
    const api = new RegistrationAPI(mockApollo(mutate), converter as never);

    await expect(api.register(credentials, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(converter.convert).not.toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ context: { fetchOptions: { signal: controller.signal } } })
    );
  });

  it('maps non-abort failures through BaseAPI handling', async () => {
    const mutate = jest.fn().mockRejectedValue(new Error('network down'));
    const converted = new ApiError({ message: 'Converted', code: 'CONVERTED' });
    const api = new RegistrationAPI(mockApollo(mutate), {
      convert: jest.fn().mockReturnValue(converted),
    } as never);

    await expect(api.register(credentials)).rejects.toBe(converted);
  });

  it('maps a 409 network status from the GraphQL transport to a ConflictError', async () => {
    const networkError = Object.assign(new Error('Conflict'), { statusCode: 409 });
    const mutate = jest.fn().mockRejectedValue(new ApolloError({ networkError }));
    const api = new RegistrationAPI(
      mockApollo(mutate),
      new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard())
    );

    await expect(api.register(credentials)).rejects.toBeInstanceOf(ConflictError);
  });

  it('falls back to generic conversion for an ApolloError with no http status', async () => {
    const graphQLError = { message: 'Something went wrong', extensions: {} };
    const mutate = jest.fn().mockRejectedValue(new ApolloError({ graphQLErrors: [graphQLError] }));
    const api = new RegistrationAPI(
      mockApollo(mutate),
      new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard())
    );

    await expect(api.register(credentials)).rejects.toBeInstanceOf(ApiError);
  });
});
