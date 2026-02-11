import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';

import getRegistrationErrorMessage from '@/modules/user/features/auth/components/form-section/auth-forms/registration-error';

describe('registration-form error mapping', () => {
  const t = (key: string): string => key;

  it('returns null when there is no error', () => {
    expect(getRegistrationErrorMessage(undefined, t)).toBeNull();
  });

  it('maps conflict code from graphQLErrors to email_used', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Email already exists', { extensions: { code: 'CONFLICT' } }),
      ],
    });

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.email_used');
  });

  it('maps conflict code from top-level errors array to email_used', () => {
    const error = new ApolloError({ errorMessage: 'Mutation completed with errors' }) as ApolloError & {
      errors: Array<{ message: string; extensions: { code: string } }>;
    };

    error.errors = [{ message: 'Email already exists', extensions: { code: 'CONFLICT' } }];

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.email_used');
  });

  it('maps top-level errors message with existing email to email_used', () => {
    const error = new ApolloError({ errorMessage: 'Mutation completed with errors' }) as ApolloError & {
      errors: Array<{ message: string }>;
    };

    error.errors = [{ message: 'Email already exists' }];

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.email_used');
  });

  it('maps ApolloError message with existing email to email_used', () => {
    const error = new ApolloError({ errorMessage: 'Email already exists' });

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.email_used');
  });

  it('maps conflict code from cause.errors to email_used', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [],
      cause: {
        errors: [{ message: 'Email already exists', extensions: { code: 'CONFLICT' } }],
      },
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.email_used');
  });

  it('maps conflict code from networkError.result.errors to email_used', () => {
    const error = {
      message: 'Mutation completed with errors',
      graphQLErrors: [],
      networkError: {
        result: {
          errors: [{ message: 'Email already exists', extensions: { code: 'CONFLICT' } }],
        },
      },
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.email_used');
  });

  it('handles Apollo-like object with missing optional error collections', () => {
    const error = {
      message: 'Unknown error',
      graphQLErrors: [],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.signup_error');
  });

  it('handles missing message and sparse error entries without conflict', () => {
    const error = {
      errors: [{}],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.signup_error');
  });

  it('handles undefined entries inside errors array without conflict', () => {
    const error = {
      errors: [undefined],
    } as unknown as ApolloError;

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.signup_error');
  });

  it('maps unknown errors to signup_error', () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Something went wrong', { extensions: { code: 'INTERNAL' } }),
      ],
    });

    expect(getRegistrationErrorMessage(error, t)).toBe('sign_up.errors.signup_error');
  });
});
