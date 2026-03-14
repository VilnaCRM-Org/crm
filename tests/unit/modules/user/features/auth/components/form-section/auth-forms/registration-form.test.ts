import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';

import getRegistrationErrorMessage from '@/modules/user/features/auth/components/form-section/auth-forms/registration-error';

describe('registration-form error mapping', () => {
  const t = (key: string): string => key;

  it('returns no errors when there is no error object', () => {
    expect(getRegistrationErrorMessage(undefined, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('maps conflict code from graphQLErrors to inline email error', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Email already exists', { extensions: { code: 'CONFLICT' } }),
      ],
    });

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.errors.email_used',
      passwordError: null,
      nameError: null,
    });
  });

  it('handles null candidates before conflict code detection', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [
        null,
        { message: 'registration failed' },
        { message: 'conflict', extensions: { code: 'CONFLICT' } },
      ],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.errors.email_used',
      passwordError: null,
      nameError: null,
    });
  });

  it('maps user-service duplicate email message to inline email error', () => {
    const error = new ApolloError({
      errorMessage: 'Mutation completed with errors',
    }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'email: This email address is already registered' }];

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.errors.email_used',
      passwordError: null,
      nameError: null,
    });
  });

  it('maps user-service duplicate email message in Ukrainian to inline email error', () => {
    const error = new ApolloError({
      errorMessage: 'Mutation completed with errors',
    }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'email: Ця email-адреса вже зареєстрована' }];

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.errors.email_used',
      passwordError: null,
      nameError: null,
    });
  });

  it('maps user-service invalid email message to inline email validator message', () => {
    const error = new ApolloError({
      errorMessage: 'Mutation completed with errors',
    }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'email: This value is not a valid email address.' }];

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.form.email_input.invalid_message',
      passwordError: null,
      nameError: null,
    });
  });

  it('maps user-service missing email message to inline email required message', () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('email: This value should not be blank.')],
    });

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.form.email_input.required',
      passwordError: null,
      nameError: null,
    });
  });

  it('returns controlled fallback for unknown email-focused validation error', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [],
      cause: {
        errors: [{ message: 'email: Something specific to backend validation' }],
      },
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'Something specific to backend validation',
      passwordError: null,
      nameError: null,
    });
  });

  it('extracts root email validation and returns controlled fallback when unmatched', () => {
    const error = {
      message: 'email: Some unknown validation issue',
      graphQLErrors: [],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'Some unknown validation issue',
      passwordError: null,
      nameError: null,
    });
  });

  it('falls back to form error when error has no nested error arrays', () => {
    const error = {
      message: 'Something went wrong',
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.client_errors.something_went_wrong',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('handles candidates with undefined message', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [{ message: 'some error' }, { extensions: { code: 'VALIDATION' } }],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.client_errors.something_went_wrong',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns null for email-prefixed candidate with empty body', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [{ message: 'email:  ' }],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.client_errors.something_went_wrong',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('falls back to form error when error has no message property', () => {
    const error = {
      graphQLErrors: [],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.client_errors.something_went_wrong',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('maps non-email errors to top-level form error', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [],
      networkError: {
        result: {
          errors: [{ message: 'password: Password must contain at least one number' }],
        },
      },
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'sign_up.form.password_input.error_numbers',
      nameError: null,
    });
  });

  it('maps password no-uppercase server error to inline password error', () => {
    const error = new ApolloError({
      errorMessage: 'Mutation completed with errors',
    }) as ApolloError & {
      errors: Array<{ message: string }>;
    };
    error.errors = [{ message: 'password: Password must contain at least one uppercase letter' }];
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'sign_up.form.password_input.error_uppercase',
      nameError: null,
    });
  });

  it('maps password no-numbers server error to inline password error', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [],
      networkError: {
        result: {
          errors: [{ message: 'password: Password must contain at least one number' }],
        },
      },
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'sign_up.form.password_input.error_numbers',
      nameError: null,
    });
  });

  it('maps password invalid-length server error to inline password error', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('password: Password must be between 8 and 64 characters long'),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'sign_up.form.password_input.error_length',
      nameError: null,
    });
  });

  it('maps password required server error to inline password error', () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('password: This value should not be blank.')],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'sign_up.form.password_input.required',
      nameError: null,
    });
  });

  it('maps password no-uppercase server error in Ukrainian to inline password error', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('password: Пароль має містити принаймні одну велику літеру'),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'sign_up.form.password_input.error_uppercase',
      nameError: null,
    });
  });

  it('maps initials only-spaces server error to inline name error', () => {
    const error = new ApolloError({
      errorMessage: 'Mutation completed with errors',
    }) as ApolloError & {
      errors: Array<{ message: string }>;
    };
    error.errors = [{ message: 'initials: Initials cannot consist only of spaces' }];
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: null,
      nameError: 'sign_up.form.name_input.only_spaces_error',
    });
  });

  it('maps initials required server error to inline name error', () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('initials: This value should not be blank.')],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: null,
      nameError: 'sign_up.form.name_input.required',
    });
  });

  it('maps initials only-spaces server error in Ukrainian to inline name error', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError("initials: Ім'я та прізвище не можуть складатися лише з пробілів"),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: null,
      nameError: 'sign_up.form.name_input.only_spaces_error',
    });
  });

  it('returns form error when root message has password prefix but empty body', () => {
    const error = {
      message: 'password:  ',
      graphQLErrors: [],
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.client_errors.something_went_wrong',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('falls back to validations.generic for unrecognized password-prefixed error', () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('password: Some unknown password policy')],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: 'Some unknown password policy',
      nameError: null,
    });
  });

  it('falls back to validations.generic for unrecognized initials-prefixed error', () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('initials: Some unknown name policy')],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: null,
      passwordError: null,
      nameError: 'Some unknown name policy',
    });
  });

  it('returns unauthorized error for networkError with 401 status code', () => {
    const error = {
      message: 'Response not successful',
      graphQLErrors: [],
      networkError: { statusCode: 401 },
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.authentication_errors.unauthorized_access',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns access denied error for networkError with 403 status code', () => {
    const error = {
      message: 'Response not successful',
      graphQLErrors: [],
      networkError: { statusCode: 403 },
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.authentication_errors.access_denied',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns server error for networkError with 5xx status code', () => {
    const error = {
      message: 'Response not successful',
      graphQLErrors: [],
      networkError: { statusCode: 500 },
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.server_errors.server_error',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns server error for INTERNAL_SERVER_ERROR extension code', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Internal error', { extensions: { code: 'INTERNAL_SERVER_ERROR' } }),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.server_errors.server_error',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns server error for SERVER_ERROR extension code', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Server error', { extensions: { code: 'SERVER_ERROR' } }),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.server_errors.server_error',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns unauthorized error for UNAUTHORIZED extension code', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } }),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.authentication_errors.unauthorized_access',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns unauthorized error for UNAUTHENTICATED extension code', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } }),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.authentication_errors.unauthorized_access',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns access denied error for FORBIDDEN extension code', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } }),
      ],
    });
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.authentication_errors.access_denied',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns network error when networkError is present without statusCode', () => {
    const error = {
      message: 'Failed to fetch',
      graphQLErrors: [],
      networkError: new TypeError('Failed to fetch'),
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.network_errors.network_error',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });

  it('returns network error when root message matches network pattern', () => {
    const error = {
      message: 'network request failed',
      graphQLErrors: [],
    } as unknown as ApolloError;
    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'failure_responses.network_errors.network_error',
      emailError: null,
      passwordError: null,
      nameError: null,
    });
  });
});
