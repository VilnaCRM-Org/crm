import { ApolloError } from '@apollo/client';

import { ApiError, ApiErrorCodes, ConflictError } from '@/modules/user/lib/api-errors';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import FieldViolationParser from '@/modules/user/transformers/field-violation-parser';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import ApiErrorFactory from '@auth/repositories/api-error-factory';
import ApiStatusErrorFactory from '@auth/repositories/api-status-error-factory';
import RegistrationAPI from '@auth/repositories/registration-api';
import { buildUser } from '@tests/builders';

type ApolloClientLike = import('@apollo/client').ApolloClient<
  import('@apollo/client').NormalizedCacheObject
>;

const rejectionFor = (message: string): Promise<unknown> => {
  const graphQLErrors = [{ message, extensions: { status: 422 } }];
  const mutate = jest.fn().mockRejectedValue(new ApolloError({ graphQLErrors }));
  const api = new RegistrationAPI(
    { mutate } as unknown as ApolloClientLike,
    new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard()),
    new UserServiceErrorTransformer(new FieldViolationParser())
  );
  return api.register(buildUser()).catch((caught: unknown) => caught);
};

describe('RegistrationAPI — an address user-service already has', () => {
  it.each([
    ['en', 'email: This email address is already registered'],
    ['uk', 'email: Ця email-адреса вже зареєстрована'],
  ])('reports a conflict for the %s violation', async (_locale, message) => {
    const rejection = await rejectionFor(message);

    expect(rejection).toBeInstanceOf(ConflictError);
    expect((rejection as ConflictError).message).toBe(
      'Registration conflict. Resource already exists.'
    );
  });

  it('reports a conflict when the address is one of several violations', async () => {
    const rejection = await rejectionFor(
      'password: This value is too weak.\nemail: This email address is already registered'
    );

    expect(rejection).toBeInstanceOf(ConflictError);
  });

  it.each([
    ['another e-mail violation', 'email: This value is not a valid email address.'],
    ['another property', 'initials: This email address is already registered'],
    ['no violation', 'This email address is already registered'],
  ])('keeps %s out of the conflict path', async (_case, message) => {
    const rejection = await rejectionFor(message);

    expect(rejection).toBeInstanceOf(ApiError);
    expect((rejection as ApiError).code).toBe(ApiErrorCodes.UNKNOWN);
  });
});
