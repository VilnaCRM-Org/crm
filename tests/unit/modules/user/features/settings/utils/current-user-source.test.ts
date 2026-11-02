import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import ApiError from '@/modules/user/lib/api-errors/api-error';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';
import correlationIdProvider from '@/services/observability/correlation-id-provider';
import observabilityCore from '@/services/observability/observability-core';
import { buildToken, buildUserNode } from '@tests/builders';

interface SessionStub extends ProtectedSession {
  readonly end: jest.Mock<void, [string]>;
}

const sessionWith = (token: string | null): SessionStub => ({
  token: () => token,
  end: jest.fn<void, [string]>(),
});

const answer = (body: unknown, status = 200): jest.SpyInstance =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

const userBody = (initials: string): unknown => ({
  data: { users: { edges: [{ node: buildUserNode({ initials }) }] } },
});

const sentRequestId = (fetchSpy: jest.SpyInstance): unknown =>
  ((fetchSpy.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>)['X-Request-Id'];

const signal = (): AbortSignal => new AbortController().signal;

describe('currentUserSource', () => {
  let capture: jest.SpyInstance;

  beforeEach(() => {
    capture = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the read full name to the display name and monogram', async () => {
    answer(userBody('Петренко Олена Іванівна'));

    await expect(currentUserSource.read(sessionWith(buildToken()), signal())).resolves.toEqual({
      kind: 'ok',
      identity: { displayName: 'Олена Петренко', monogram: 'ОП' },
    });
    expect(capture).not.toHaveBeenCalled();
  });

  it('sends the session token and a fresh request id', async () => {
    const token = buildToken();
    const fetchSpy = answer(userBody('Anna Koval'));

    await currentUserSource.read(sessionWith(token), signal());

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${token}`);
    expect(sentRequestId(fetchSpy)).toBe(correlationIdProvider.currentId);
    expect(correlationIdProvider.currentId).not.toBe('');
  });

  it('reports a session without a token as ended and sends nothing', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const session = sessionWith(null);

    await expect(currentUserSource.read(session, signal())).resolves.toEqual({
      kind: 'failed',
      reason: 'session_ended',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(session.end).not.toHaveBeenCalled();
  });

  it('ends the session it sent the token of when the API answers 401', async () => {
    const token = buildToken();
    const session = sessionWith(token);
    const fetchSpy = answer({ errors: [] }, 401);

    await expect(currentUserSource.read(session, signal())).resolves.toEqual({
      kind: 'failed',
      reason: 'session_ended',
    });
    expect(session.end).toHaveBeenCalledTimes(1);
    expect(session.end).toHaveBeenCalledWith(token);
    expect(session.end.mock.contexts[0]).toBe(session);
    expect(capture).toHaveBeenCalledWith(expect.any(ApiError), {
      source: 'settings:current-user',
      'X-Request-Id': sentRequestId(fetchSpy),
    });
    expect(capture.mock.calls[0]?.[0]).toMatchObject({ status: 401 });
  });

  it('reports a denied GraphQL answer as an ended session without ending it', async () => {
    const session = sessionWith(buildToken());
    const errors = [{ message: 'Access Denied.' }];
    answer({ data: null, errors });

    await expect(currentUserSource.read(session, signal())).resolves.toEqual({
      kind: 'failed',
      reason: 'session_ended',
    });
    expect(session.end).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture.mock.calls[0]?.[0]).toMatchObject({ cause: errors });
  });

  it.each([
    ['a server error', (): unknown => answer(userBody('Anna Koval'), 503)],
    ['a GraphQL error', (): unknown => answer({ errors: [{ message: 'boom' }] })],
    ['an answer that is not a user', (): unknown => answer({ data: { users: null } })],
  ])('reports %s as unavailable, captured, with the session kept', async (_name, arrange) => {
    arrange();
    const session = sessionWith(buildToken());

    await expect(currentUserSource.read(session, signal())).resolves.toEqual({
      kind: 'failed',
      reason: 'unavailable',
    });
    expect(session.end).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture.mock.calls[0]?.[1]).toEqual({
      source: 'settings:current-user',
      'X-Request-Id': correlationIdProvider.currentId,
    });
  });

  it('reports a transport failure as unavailable and captures it', async () => {
    const failure = new TypeError('Failed to fetch');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(failure);
    const session = sessionWith(buildToken());

    await expect(currentUserSource.read(session, signal())).resolves.toEqual({
      kind: 'failed',
      reason: 'unavailable',
    });
    expect(session.end).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith(failure, {
      source: 'settings:current-user',
      'X-Request-Id': correlationIdProvider.currentId,
    });
  });

  it('captures nothing for a read its caller aborted', async () => {
    const controller = new AbortController();
    jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      controller.abort();
      return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    });

    await expect(
      currentUserSource.read(sessionWith(buildToken()), controller.signal)
    ).resolves.toEqual({ kind: 'failed', reason: 'unavailable' });
    expect(capture).not.toHaveBeenCalled();
  });
});
