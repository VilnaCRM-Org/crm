import { HttpResponse, type JsonBodyType } from 'msw';

import '../../../../setup';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken, buildUserNode } from '@tests/builders';

import { answerProfileOperation } from '../../../../mocks/profile-operations';
import server from '../../../../mocks/server';

const freshSignal = (): AbortSignal => new AbortController().signal;

const answerJson = (body: JsonBodyType, status = 200): ReturnType<typeof answerProfileOperation> =>
  answerProfileOperation('CurrentUser', { respond: () => HttpResponse.json(body, { status }) });

const read = (): ReturnType<typeof currentUserSource.read> =>
  currentUserSource.read(authSessionProvider, freshSignal());

describe('currentUserSource over msw (integration)', () => {
  let token: string;

  beforeEach(() => {
    token = buildToken();
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('reads the signed-in user with the session token and maps the display name', async () => {
    const answered = answerJson({
      data: { users: { edges: [{ node: buildUserNode({ initials: 'Koval Anna Petrivna' }) }] } },
    });

    await expect(read()).resolves.toEqual({
      kind: 'ok',
      identity: { displayName: 'Anna Koval', monogram: 'AK' },
    });
    expect(answered[0]?.authorization).toBe(`Bearer ${token}`);
  });

  it('ends the session the 401 answered and reports it ended', async () => {
    answerProfileOperation('CurrentUser', {
      respond: () => new HttpResponse(null, { status: 401 }),
    });

    await expect(read()).resolves.toEqual({ kind: 'failed', reason: 'session_ended' });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('keeps a newer session when the 401 answered an older token', async () => {
    const newer = buildToken();
    answerProfileOperation('CurrentUser', {
      respond: () => {
        useAuthStore.setState({ token: newer });
        return new HttpResponse(null, { status: 401 });
      },
    });

    await expect(read()).resolves.toEqual({ kind: 'failed', reason: 'session_ended' });
    expect(useAuthStore.getState().token).toBe(newer);
  });

  it('reports a session without a token as ended and sends nothing', async () => {
    const answered = answerJson({ data: null });
    useAuthStore.setState({ token: null });

    await expect(read()).resolves.toEqual({ kind: 'failed', reason: 'session_ended' });
    expect(answered).toHaveLength(0);
  });

  it.each([
    ['an Access Denied. message', { message: 'Access Denied.' }, 'session_ended'],
    ['an extension status of 401', { message: 'x', extensions: { status: 401 } }, 'session_ended'],
    ['another GraphQL error', { message: 'x', extensions: { status: 500 } }, 'unavailable'],
  ] as const)('reads %s on the first GraphQL error', async (_name, first, reason) => {
    answerJson({ data: null, errors: [first] });

    await expect(read()).resolves.toEqual({ kind: 'failed', reason });
    expect(useAuthStore.getState().token).toBe(token);
  });

  it.each([
    ['a server error', (): Response => new HttpResponse(null, { status: 503 })],
    ['a body that is not JSON', (): Response => new HttpResponse('<html>', { status: 200 })],
    ['an empty envelope', (): Response => HttpResponse.json({})],
    ['a null body', (): Response => HttpResponse.json(null)],
    ['a list of users', (): Response => HttpResponse.json({ data: { users: { edges: {} } } })],
    ['no user', (): Response => HttpResponse.json({ data: { users: { edges: [] } } })],
    ['a transport failure', (): Response => HttpResponse.error()],
  ])('reports %s as unavailable and keeps the session', async (_name, respond) => {
    answerProfileOperation('CurrentUser', { respond });

    await expect(read()).resolves.toEqual({ kind: 'failed', reason: 'unavailable' });
    expect(useAuthStore.getState().token).toBe(token);
  });

  it('reports a read its caller aborted as unavailable', async () => {
    answerJson({ data: null });
    const controller = new AbortController();

    const reading = currentUserSource.read(authSessionProvider, controller.signal);
    controller.abort();

    await expect(reading).resolves.toEqual({ kind: 'failed', reason: 'unavailable' });
    expect(useAuthStore.getState().token).toBe(token);
  });
});
