import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import type GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import type GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import { HttpError } from '@/services/https-client/http-error';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import {
  buildEmail,
  buildPassword,
  buildProfileChange,
  buildToken,
  buildUserIri,
  buildUserNode,
} from '@tests/builders';

import {
  answerProfileOperation,
  type ProfileOperation,
} from '../../../../mocks/profile-operations';
import server from '../../../../mocks/server';

const provider = container.resolve<ProfileProvider>(AUTH_TOKENS.ProfileProvider);

const { signal } = new AbortController();

const run = (operation: ProfileOperation, caller: AbortSignal = signal): Promise<unknown> => {
  if (operation === 'CurrentUser') return provider.read(caller);
  if (operation === 'UpdateUser') return provider.update(buildProfileChange(), caller);
  return provider.resend(buildUserIri(), caller);
};

const OPERATIONS: readonly ProfileOperation[] = ['CurrentUser', 'UpdateUser', 'ResendEmailToUser'];

const problem = (status: number): Response =>
  new HttpResponse(
    JSON.stringify({
      type: 'about:blank',
      title: status === 401 ? 'Unauthorized' : 'Error',
      status,
      detail: 'Authentication required.',
    }),
    {
      status,
      headers: { 'Content-Type': 'application/problem+json', 'WWW-Authenticate': 'Bearer' },
    }
  );

const graphQLError = (error: object): Response =>
  HttpResponse.json({ data: null, errors: [error] });

const failed = (reason: string): object => ({ kind: 'failed', reason });

describe('ProfileProvider over the container client (integration)', () => {
  const token = buildToken();

  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('resolves one singleton', () => {
    expect(container.resolve(AUTH_TOKENS.ProfileProvider)).toBe(provider);
    expect(provider).toBeInstanceOf(ProfileProvider);
  });

  it('returns the user entity for a read and the update outcome for a save', async () => {
    const node = buildUserNode();
    answerProfileOperation('CurrentUser', {
      respond: () => HttpResponse.json({ data: { users: { edges: [{ node }] } } }),
    });
    answerProfileOperation('UpdateUser', {
      respond: () => HttpResponse.json({ data: { updateUser: { user: node } } }),
    });
    const user = {
      id: node.id,
      fullName: node.initials,
      email: node.email,
      confirmed: node.confirmed,
    };

    await expect(provider.read(signal)).resolves.toEqual({ kind: 'ok', user });
    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual({
      kind: 'ok',
      user,
    });
  });

  it('returns the confirmation of a resend', async () => {
    answerProfileOperation('ResendEmailToUser', {
      respond: () =>
        HttpResponse.json({
          data: { resendEmailToUser: { user: { id: buildUserIri(), confirmed: false } } },
        }),
    });

    await expect(provider.resend(buildUserIri(), signal)).resolves.toEqual({
      kind: 'sent',
      confirmed: false,
    });
  });

  describe.each(OPERATIONS)('%s', (operation) => {
    it('clears the token on a transport 401 and ends the session', async () => {
      answerProfileOperation(operation, { respond: (): Response => problem(401) });

      await expect(run(operation)).resolves.toEqual(failed('session_ended'));
      expect(useAuthStore.getState().token).toBeNull();
    });

    it.each([
      ['no extensions', { message: 'Access Denied.' }],
      ['extensions.status 403', { message: 'Access Denied.', extensions: { status: 403 } }],
    ])(
      'ends the session without touching the token on "Access Denied." with %s',
      async (_n, error) => {
        answerProfileOperation(operation, { respond: (): Response => graphQLError(error) });

        await expect(run(operation)).resolves.toEqual(failed('session_ended'));
        expect(useAuthStore.getState().token).toBe(token);
      }
    );

    it.each([
      ['HTTP 429', (): Response => problem(429), 'rate_limited'],
      ['HTTP 500', (): Response => problem(500), 'transient'],
      ['HTTP 503', (): Response => problem(503), 'transient'],
      ['a network failure', (): Response => HttpResponse.error(), 'transient'],
      [
        'a code-less GraphQL error',
        (): Response => graphQLError({ message: 'Something odd' }),
        'rejected',
      ],
      [
        'a coded GraphQL error',
        (): Response =>
          graphQLError({ message: 'Server crash', extensions: { code: 'BAD_REQUEST' } }),
        'rejected',
      ],
    ])('answers %s with %s', async (_name, respond, reason) => {
      const answered = answerProfileOperation(operation, { respond });

      await expect(run(operation)).resolves.toEqual(failed(reason));
      expect(answered).toHaveLength(1);
      expect(useAuthStore.getState().token).toBe(token);
    });

    it('answers a deadline with a transient failure', async () => {
      jest
        .spyOn(DeadlineFetchAdapter.prototype, 'fetch')
        .mockRejectedValueOnce(new HttpError({ status: 0, message: 'Request timed out' }));

      await expect(run(operation)).resolves.toEqual(failed('transient'));
    });

    it('sends nothing and settles for a signal that was aborted before the call', async () => {
      const answered = answerProfileOperation(operation, { respond: () => HttpResponse.json({}) });
      const controller = new AbortController();
      controller.abort();

      const outcome = await run(operation, controller.signal);

      expect(outcome).toEqual(failed('transient'));
      expect(answered).toHaveLength(0);
    });
  });

  it('answers an empty connection and a malformed read with a rejection', async () => {
    answerProfileOperation('CurrentUser', {
      respond: () => HttpResponse.json({ data: { users: { edges: [] } } }),
    });
    await expect(provider.read(signal)).resolves.toEqual(failed('rejected'));

    answerProfileOperation('CurrentUser', {
      respond: () => HttpResponse.json({ data: { users: { edges: [{ node: null }] } } }),
    });
    await expect(provider.read(signal)).resolves.toEqual(failed('rejected'));
  });

  it('sends the changed e-mail and new password without a name the user left alone', async () => {
    const answered = answerProfileOperation('UpdateUser', {
      respond: () => HttpResponse.json({ data: { updateUser: { user: buildUserNode() } } }),
    });
    const change = {
      id: buildUserIri(),
      currentPassword: buildPassword(),
      email: buildEmail(),
      newPassword: buildPassword(),
    };

    await provider.update(change, signal);

    expect(answered).toHaveLength(1);
    expect(answered[0]?.variables['input']).toEqual({
      id: change.id,
      password: change.currentPassword,
      email: change.email,
      newPassword: change.newPassword,
      clientMutationId: expect.any(String),
    });
  });

  it.each([
    [
      'CurrentUser',
      (): Response =>
        HttpResponse.json({
          data: { users: { edges: [{ node: { ...buildUserNode(), confirmed: 'yes' } }] } },
        }),
    ],
    [
      'UpdateUser',
      (): Response =>
        HttpResponse.json({
          data: { updateUser: { user: { ...buildUserNode(), confirmed: 'yes' } } },
        }),
    ],
    [
      'ResendEmailToUser',
      (): Response =>
        HttpResponse.json({
          data: { resendEmailToUser: { user: { id: buildUserIri(), confirmed: 'yes' } } },
        }),
    ],
    [
      'ResendEmailToUser',
      (): Response => HttpResponse.json({ data: { resendEmailToUser: { user: null } } }),
    ],
  ] as const)('rejects a %s answer outside the response contract', async (operation, respond) => {
    answerProfileOperation(operation, { respond });

    await expect(run(operation)).resolves.toEqual(failed('rejected'));
  });

  it.each([
    ['carries a line no field claims', 'initials: This value is too long.\nSomething else broke.'],
    ['names a field the form does not own', 'token: This value is not valid.'],
  ])('rejects an update whose violation message %s', async (_name, message) => {
    answerProfileOperation('UpdateUser', {
      respond: () => graphQLError({ message, extensions: { code: 'BAD_USER_INPUT', status: 422 } }),
    });

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual(
      failed('rejected')
    );
  });

  it('maps an update violation to a field error, a resend one to a rejection', async () => {
    const violation = (): Response =>
      graphQLError({
        message: 'initials: This value is too long.',
        extensions: { code: 'BAD_USER_INPUT', status: 422 },
      });
    answerProfileOperation('UpdateUser', { respond: violation });
    answerProfileOperation('ResendEmailToUser', { respond: violation });

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual({
      kind: 'invalid',
      errors: { items: [{ field: 'fullName', reason: 'name_rejected' }] },
    });
    await expect(provider.resend(buildUserIri(), signal)).resolves.toEqual(failed('rejected'));
  });

  it('answers a taken e-mail with the taken field error', async () => {
    answerProfileOperation('UpdateUser', {
      respond: () =>
        graphQLError({
          message: 'email: This email address is already registered',
          extensions: { code: 'BAD_USER_INPUT', status: 422 },
        }),
    });

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual({
      kind: 'invalid',
      errors: { items: [{ field: 'email', reason: 'email_taken' }] },
    });
  });

  it('answers "Old password is invalid" on UpdateUser with password_wrong', async () => {
    answerProfileOperation('UpdateUser', {
      respond: (): Response => graphQLError({ message: 'Old password is invalid' }),
    });

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
  });
  it('captures a programming error through the container observability service', async () => {
    const bug = new TypeError('Cannot read properties of undefined');
    const transformer = container.resolve<GraphQLProfileTransformer>(
      AUTH_TOKENS.GraphQLProfileTransformer
    );
    const observability = container.resolve<ObservabilityService>(
      OBSERVABILITY_TOKENS.ObservabilityService
    );
    jest.spyOn(transformer, 'toUpdateInput').mockImplementation(() => {
      throw bug;
    });
    const captureError = jest.spyOn(observability, 'captureError');

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual(
      failed('rejected')
    );
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(bug, {
      source: 'settings:profile',
      stage: 'update',
    });
  });
  it('captures a non-Error rejection of a read, which never reached the link', async () => {
    const repository = container.resolve<GraphQLProfileRepository>(
      AUTH_TOKENS.GraphQLProfileRepository
    );
    const observability = container.resolve<ObservabilityService>(
      OBSERVABILITY_TOKENS.ObservabilityService
    );
    jest.spyOn(repository, 'read').mockRejectedValue('not an error');
    const captureError = jest.spyOn(observability, 'captureError');

    await expect(provider.read(signal)).resolves.toEqual(failed('rejected'));
    expect(captureError).toHaveBeenCalledWith('not an error', {
      source: 'settings:profile',
      stage: 'read',
    });
  });
});
