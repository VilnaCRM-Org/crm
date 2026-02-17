import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';

import getRegistrationErrorMessage from '@/modules/user/features/auth/components/form-section/auth-forms/registration-error';

describe('registration-form error mapping', () => {
  const t = (key: string): string => key;

  it('returns no errors when there is no error object', () => {
    expect(getRegistrationErrorMessage(undefined, t)).toEqual({
      formError: null,
      emailError: null,
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
    });
  });

  it('maps user-service duplicate email message to inline email error', () => {
    const error = new ApolloError({ errorMessage: 'Mutation completed with errors' }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'email: This email address is already registered' }];

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.errors.email_used',
    });
  });

  it('maps user-service duplicate email message in Ukrainian to inline email error', () => {
    const error = new ApolloError({ errorMessage: 'Mutation completed with errors' }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'email: Ця email-адреса вже зареєстрована' }];

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.errors.email_used',
    });
  });

  it('maps user-service invalid email message to inline email validator message', () => {
    const error = new ApolloError({ errorMessage: 'Mutation completed with errors' }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'email: This value is not a valid email address.' }];

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.form.email_input.invalid_message',
    });
  });

  it('maps user-service missing email message to inline email required message', () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('email: This value should not be blank.')],
    });

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'sign_up.form.email_input.required',
    });
  });

  it('returns backend message text for unknown email-focused validation error', () => {
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
    });
  });

  it('extracts email validation from root error message when no candidates match', () => {
    const error = {
      message: 'email: Some unknown validation issue',
      graphQLErrors: [],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: null,
      emailError: 'Some unknown validation issue',
    });
  });

  it('falls back to form error when error has no nested error arrays', () => {
    const error = {
      message: 'Something went wrong',
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'sign_up.errors.signup_error',
      emailError: null,
    });
  });

  it('handles candidates with undefined message', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [{ message: 'some error' }, { extensions: { code: 'VALIDATION' } }],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'sign_up.errors.signup_error',
      emailError: null,
    });
  });

  it('returns null for email-prefixed candidate with empty body', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [{ message: 'email:  ' }],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'sign_up.errors.signup_error',
      emailError: null,
    });
  });

  it('falls back to form error when error has no message property', () => {
    const error = {
      graphQLErrors: [],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toEqual({
      formError: 'sign_up.errors.signup_error',
      emailError: null,
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
      formError: 'sign_up.errors.signup_error',
      emailError: null,
    });
  });
});
