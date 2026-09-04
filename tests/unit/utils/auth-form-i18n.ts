import type { TFunction } from 'i18next';

/**
 * Shared harness for the auth form-field contract tests. The `jest.mock` factories stay in each
 * suite — they are hoisted per module and mock different component contracts — but the identity
 * translator and the validator stubs are identical, so they live here to stop the two suites
 * drifting apart when field props change.
 */

/** Returns the i18n key itself, so a test can assert which key a field was given. */
export const identityTranslator = ((key: string): string => key) as unknown as TFunction;

/** Fresh jest.fn() validators per call, so suites never share call history. */
export const stubValidators = <T>(): T =>
  ({
    email: jest.fn(),
    password: jest.fn(),
    fullName: jest.fn(),
  }) as unknown as T;
