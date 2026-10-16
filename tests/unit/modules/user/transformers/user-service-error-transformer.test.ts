import { ApolloError } from '@apollo/client';
import { faker } from '@faker-js/faker';

import UserServiceErrorTransformer from '@/modules/user/transformers';
import type {
  FieldViolationReason,
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
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

const violation = (
  path: string,
  status: number | null,
  reason: FieldViolationReason = 'other'
): UserServiceFailure => ({
  reason: 'violation',
  status,
  violations: { items: [{ path, reason }] },
});

const failed = (reason: UserServiceFailureReason, status: number | null): UserServiceFailure => ({
  reason,
  status,
  violations: none,
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
    [401, 'unauthenticated'],
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

  it.each(['email', 'token', 'newPassword', 'initials', 'password'])(
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
    const error = graphQLError('clientMutationId: too short', { status: 422 });

    expect(transformer.normalize(error)).toEqual(failed('violation', 422));
  });

  it.each(['initials', 'password'])(
    'classifies a %s violation with a 422 status as one field violation of reason other',
    (path) => {
      const error = graphQLError(`${path}: too short`, { status: 422 });

      expect(transformer.normalize(error)).toEqual(violation(path, 422));
    }
  );

  it.each([
    ['a transport 401', serverError(401)],
    ['a GraphQL extensions.status 401', graphQLError('Unauthorized', { status: 401 })],
  ])('classifies %s as unauthenticated with status 401', (_name, error) => {
    expect(transformer.normalize(error)).toEqual(failed('unauthenticated', 401));
  });

  it.each([400, 402, 403, 404, 409])('keeps status %i out of the unauthenticated row', (status) => {
    expect(transformer.normalize(serverError(status)).reason).not.toBe('unauthenticated');
  });

  it.each([
    ['no extensions', undefined, null],
    ['extensions.status 403', { status: 403 }, 403],
    ['the local mock shape', { code: 'FORBIDDEN', status: 403 }, 403],
  ])('classifies "Access Denied." with %s as access_denied', (_name, extensions, status) => {
    expect(transformer.normalize(graphQLError('Access Denied.', extensions))).toEqual(
      failed('access_denied', status)
    );
  });

  it.each(['Old password is invalid', 'Старий пароль невірний'])(
    'classifies "%s" as invalid_password with and without a status',
    (message) => {
      expect(transformer.normalize(graphQLError(message))).toEqual(
        failed('invalid_password', null)
      );
      expect(transformer.normalize(graphQLError(message, { status: 200 }))).toEqual(
        failed('invalid_password', 200)
      );
    }
  );

  it('matches a table message as a whole text only', () => {
    expect(transformer.normalize(graphQLError('Old password is invalid. Retry'))).toEqual(
      failed('refused', null)
    );
  });

  it.each([
    ['en', 'This email address is already registered'],
    ['uk', 'Ця email-адреса вже зареєстрована'],
  ])('classifies the %s uniqueness message as a taken e-mail violation', (_locale, text) => {
    expect(transformer.normalize(graphQLError(`email: ${text}`))).toEqual(
      violation('email', null, 'taken')
    );
    expect(transformer.normalize(graphQLError(`email: ${text}`, { status: 422 }))).toEqual(
      violation('email', 422, 'taken')
    );
  });

  it.each(['email', 'initials', 'password', 'newPassword', 'token'])(
    'keeps reason other for a %s violation whose text is not the uniqueness message',
    (path) => {
      expect(transformer.normalize(graphQLError(`${path}: This email address is taken`))).toEqual(
        violation(path, null)
      );
    }
  );

  it('gives a table message the same result with and without extensions.code', () => {
    const plain = transformer.normalize(graphQLError('Access Denied.', { status: 403 }));
    const coded = transformer.normalize(
      graphQLError('Access Denied.', { status: 403, code: 'FORBIDDEN' })
    );

    expect(coded).toEqual(plain);
  });

  it('leaves the resend time-out to the refusal step', () => {
    const error = graphQLError('Cannot send new email till 2026-10-08T10:00:00+00:00');

    expect(transformer.normalize(error)).toEqual(failed('refused', null));
  });

  it.each(['\n', '\r\n', '\n\n'])(
    'reads one violation per line of a multi-line message separated by %j',
    (separator) => {
      const message = ['initials: too short', 'newPassword: too weak'].join(separator);

      expect(transformer.normalize(graphQLError(message, { status: 422 }))).toEqual({
        reason: 'violation',
        status: 422,
        violations: {
          items: [
            { path: 'initials', reason: 'other' },
            { path: 'newPassword', reason: 'other' },
          ],
        },
      });
    }
  );

  it('keeps the taken reason on the line that carries the uniqueness message', () => {
    const message = 'initials: too short\nemail: This email address is already registered';

    expect(transformer.normalize(graphQLError(message)).violations.items).toEqual([
      { path: 'initials', reason: 'other' },
      { path: 'email', reason: 'taken' },
    ]);
  });

  it.each([
    ['unknown first', 'clientMutationId: bad\ninitials: too short'],
    ['unknown last', 'initials: too short\nclientMutationId: bad'],
  ])('gives an empty violation set when a line has an unknown path (%s)', (_name, message) => {
    expect(transformer.normalize(graphQLError(message, { status: 422 }))).toEqual(
      failed('violation', 422)
    );
  });

  it('does not treat a multi-line message without a known prefix as a violation', () => {
    expect(transformer.normalize(graphQLError('Something odd\nMore text'))).toEqual(
      failed('refused', null)
    );
  });

  it('classifies extensions.status 429 as rate_limited', () => {
    expect(transformer.normalize(graphQLError('Too many requests', { status: 429 })).reason).toBe(
      'rate_limited'
    );
  });

  it.each([
    ['without extensions', undefined],
    ['with empty extensions', {}],
  ])('classifies a message-only error %s as refused', (_name, extensions) => {
    expect(transformer.normalize(graphQLError(faker.lorem.sentence(), extensions))).toEqual({
      reason: 'refused',
      status: null,
      violations: none,
    });
  });

  it.each([
    ['a server crash', 'INTERNAL_SERVER_ERROR'],
    ['a schema that lacks the operation', 'GRAPHQL_VALIDATION_FAILED'],
    ['a malformed request', 'BAD_REQUEST'],
    ['an input error without a status', 'BAD_USER_INPUT'],
  ])('classifies a coded error without a status (%s) as unknown, never refused', (_name, code) => {
    expect(transformer.normalize(graphQLError(faker.lorem.sentence(), { code }))).toEqual({
      reason: 'unknown',
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
