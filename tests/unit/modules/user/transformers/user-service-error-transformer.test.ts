import { ApolloError } from '@apollo/client';
import { faker } from '@faker-js/faker';

import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import { HttpError } from '@/services/https-client/http-error';
import loadIsolated from '@tests/unit/utils/isolated-module';

const transformer = new UserServiceErrorTransformer();

const none = { items: [] };

const withNetworkError = (networkError: Error): ApolloError => new ApolloError({ networkError });

const serverError = (statusCode: number): ApolloError =>
  withNetworkError(Object.assign(new Error('Response not successful'), { statusCode }));

const graphQLError = (message: string, extensions?: Record<string, unknown>): ApolloError =>
  new ApolloError({ graphQLErrors: [extensions ? { message, extensions } : { message }] });

const abortError = (): Error => Object.assign(new Error('aborted'), { name: 'AbortError' });

const violation = (path: string, status: number | null): UserServiceFailure => ({
  reason: 'violation',
  status,
  violations: { items: [{ path, reason: 'other' }] },
});

const loadTransformer = async (): Promise<UserServiceErrorTransformer> => {
  const Transformer = await loadIsolated(
    async () => (await import('@/modules/user/transformers/user-service-error-transformer')).default
  );
  return new Transformer();
};

describe('UserServiceErrorTransformer', () => {
  it.each([
    [0, 'network'],
    [422, 'violation'],
    [429, 'rate_limited'],
  ])('maps a freshly loaded status %i to %s', async (statusCode, reason) => {
    const loaded = await loadTransformer();
    const networkError = Object.assign(new Error('failed'), { statusCode });

    expect(loaded.normalize(withNetworkError(networkError))).toEqual({
      reason,
      status: statusCode,
      violations: none,
    });
  });

  it.each(['email', 'token', 'newPassword'])(
    'recognises a %s violation with a freshly loaded property list',
    async (path) => {
      const loaded = await loadTransformer();

      expect(loaded.normalize(graphQLError(`${path}: ${faker.lorem.sentence()}`))).toEqual(
        violation(path, null)
      );
    }
  );

  it('classifies any error as aborted when the caller signal is aborted', () => {
    const controller = new AbortController();
    controller.abort();

    expect(transformer.normalize(serverError(503), controller.signal)).toEqual({
      reason: 'aborted',
      status: null,
      violations: none,
    });
  });

  it.each([
    ['a thrown AbortError', abortError()],
    ['an AbortError network error', withNetworkError(abortError())],
  ])('classifies %s as aborted', (_name, error) => {
    expect(transformer.normalize(error).reason).toBe('aborted');
  });

  it.each([
    [
      'the deadline HttpError',
      new HttpError({ status: 0, message: 'Request timed out' }),
      'network',
      0,
    ],
    ['HTTP 429', { statusCode: 429 }, 'rate_limited', 429],
    ['HTTP 500', { statusCode: 500 }, 'server', 500],
    ['HTTP 503', { statusCode: 503 }, 'server', 503],
    ['HTTP 599', { statusCode: 599 }, 'server', 599],
    ['HTTP 400', { statusCode: 400 }, 'unknown', 400],
  ])('classifies %s as %s with the status kept', (_name, cause, reason, status) => {
    const networkError = Object.assign(new Error('failed'), cause);

    expect(transformer.normalize(withNetworkError(networkError))).toEqual({
      reason,
      status,
      violations: none,
    });
  });

  it.each(['Failed to fetch', 'Load failed'])(
    'classifies a status-less "%s" network error as network',
    (message) => {
      expect(transformer.normalize(withNetworkError(new TypeError(message)))).toEqual({
        reason: 'network',
        status: null,
        violations: none,
      });
    }
  );

  it.each(['token', 'email', 'newPassword'])(
    'classifies a %s violation with a 422 status as one field violation',
    (path) => {
      const error = graphQLError(`${path}: ${faker.lorem.sentence()}`, { status: 422 });

      expect(transformer.normalize(error)).toEqual(violation(path, 422));
    }
  );

  it.each(['token', 'email', 'newPassword'])(
    'classifies a %s violation without a status as one field violation',
    (path) => {
      expect(transformer.normalize(graphQLError(`${path}: ${faker.lorem.sentence()}`))).toEqual(
        violation(path, null)
      );
    }
  );

  it('classifies a 422 without a property prefix as a violation with an empty set', () => {
    expect(transformer.normalize(graphQLError('Validation failed', { status: 422 }))).toEqual({
      reason: 'violation',
      status: 422,
      violations: none,
    });
  });

  it('classifies an unknown property prefix with a 422 as an empty violation', () => {
    expect(transformer.normalize(graphQLError('initials: too short', { status: 422 }))).toEqual({
      reason: 'violation',
      status: 422,
      violations: none,
    });
  });

  it('classifies extensions.status 429 as rate_limited', () => {
    expect(transformer.normalize(graphQLError('Too many requests', { status: 429 })).reason).toBe(
      'rate_limited'
    );
  });

  it.each([
    ['without a code', undefined],
    ['with a code', { code: 'BAD_USER_INPUT' }],
  ])('classifies a message-only error %s as refused', (_name, extensions) => {
    expect(transformer.normalize(graphQLError(faker.lorem.sentence(), extensions))).toEqual({
      reason: 'refused',
      status: null,
      violations: none,
    });
  });

  it('never reads the message for meaning', () => {
    const first = transformer.normalize(graphQLError('Token has expired.'));
    const second = transformer.normalize(graphQLError('User not found.'));

    expect([first.reason, second.reason]).toEqual(['refused', 'refused']);
  });

  it.each([
    ['a thrown non-Apollo error', new Error('boom')],
    ['a thrown string', 'boom'],
    ['null', null],
    ['an Apollo error with nothing in it', new ApolloError({})],
  ])('classifies %s as unknown', (_name, error) => {
    expect(transformer.normalize(error)).toEqual({
      reason: 'unknown',
      status: null,
      violations: none,
    });
  });
});
