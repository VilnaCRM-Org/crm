import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import { HttpError } from '@/services/https-client/http-error';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildProfileChange, buildToken, buildUserIri, buildUserNode } from '@tests/builders';

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
      kind: 'confirmed',
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
});
