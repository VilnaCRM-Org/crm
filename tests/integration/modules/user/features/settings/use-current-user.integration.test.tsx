import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router';

import '../../../../setup';
import useCurrentUser from '@/modules/user/features/settings/hooks/use-current-user';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildFullName, buildToken, buildUserNode } from '@tests/builders';

import { answerProfileOperation } from '../../../../mocks/profile-operations';
import server from '../../../../mocks/server';

const context: ProtectedSessionContext = {
  signOut: () => undefined,
  session: authSessionProvider,
  twoFactorStatus: 'unknown',
  setTwoFactorStatus: () => undefined,
};

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route element={<Outlet context={context} />}>
        <Route path="*" element={children} />
      </Route>
    </Routes>
  </MemoryRouter>
);

function TokenGuard(): JSX.Element | null {
  const token = useAuthStore((state) => state.token);

  return token === null ? null : <Outlet context={context} />;
}

const guardedWrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route element={<TokenGuard />}>
        <Route path="*" element={children} />
      </Route>
    </Routes>
  </MemoryRouter>
);

const mountCurrentUser = (): { current: ReturnType<typeof useCurrentUserWithNavigation> } =>
  renderHook(() => useCurrentUserWithNavigation(), { wrapper }).result;

function useCurrentUserWithNavigation(): ReturnType<typeof useCurrentUser> & {
  readonly go: (path: string) => void;
} {
  const navigate = useNavigate();
  return { ...useCurrentUser(), go: (path: string): void => void navigate(path) };
}

const answerWith = (fullName: string): ReturnType<typeof answerProfileOperation> =>
  answerProfileOperation('CurrentUser', {
    respond: () =>
      HttpResponse.json({
        data: { users: { edges: [{ node: buildUserNode({ initials: fullName }) }] } },
      }),
  });

describe('useCurrentUser over the container-free read (integration)', () => {
  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token: buildToken() });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    server.resetHandlers();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('starts name-less and pending, then shows the monogram and display name', async () => {
    const answered = answerWith('Anna Koval');

    const hook = mountCurrentUser();

    expect(hook.current.status).toBe('pending');
    expect(hook.current.identity).toBeNull();
    await waitFor(() => expect(hook.current.status).toBe('ready'));
    expect(hook.current.identity).toEqual({ displayName: 'Anna Koval', monogram: 'AK' });
    expect(answered[0]?.authorization).toBe(`Bearer ${useAuthStore.getState().token}`);
  });

  it('turns a three-word full name into first name, last name and their initials', async () => {
    answerWith('Koval Anna Petrivna');

    const hook = mountCurrentUser();

    await waitFor(() => expect(hook.current.status).toBe('ready'));
    expect(hook.current.identity).toEqual({ displayName: 'Anna Koval', monogram: 'AK' });
  });

  it('drops the answer of a read that a pathname change replaced', async () => {
    const delayed = answerProfileOperation('CurrentUser', {
      respond: () =>
        HttpResponse.json({
          data: { users: { edges: [{ node: buildUserNode({ initials: 'Old Name' }) }] } },
        }),
      delayMs: 150,
    });
    const hook = mountCurrentUser();
    await waitFor(() => expect(delayed).toHaveLength(1));
    const replacement = answerWith('Anna Koval');

    act(() => hook.current.go('/settings'));
    await waitFor(() => expect(hook.current.identity?.displayName).toBe('Anna Koval'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)));

    expect(replacement).toHaveLength(1);
    expect(delayed).toHaveLength(1);
    expect(hook.current.identity?.displayName).toBe('Anna Koval');
  });

  it('reads once on mount and once more for each pathname change', async () => {
    const answered = answerWith('Anna Koval');
    const hook = mountCurrentUser();
    await waitFor(() => expect(answered).toHaveLength(1));

    act(() => hook.current.go('/settings'));
    await waitFor(() => expect(answered).toHaveLength(2));
    act(() => hook.current.go('/'));
    await waitFor(() => expect(answered).toHaveLength(3));
  });

  it('stays name-less and failed when the read fails for any other reason', async () => {
    const answered = answerProfileOperation('CurrentUser', {
      respond: () => new HttpResponse(null, { status: 400 }),
    });

    const hook = mountCurrentUser();

    await waitFor(() => expect(answered).toHaveLength(1));
    await waitFor(() => expect(hook.current.status).toBe('failed'));
    expect(hook.current.identity).toBeNull();
  });

  it('keeps the last good identity when a later read fails for another reason', async () => {
    const read = jest.spyOn(currentUserSource, 'read');
    answerWith('Anna Koval');
    const hook = mountCurrentUser();
    await waitFor(() => expect(hook.current.status).toBe('ready'));

    const failed = answerProfileOperation('CurrentUser', {
      respond: () => new HttpResponse(null, { status: 400 }),
    });
    act(() => hook.current.go('/settings'));
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    await act(() =>
      expect(read.mock.results[1]?.value).resolves.toEqual({
        kind: 'failed',
        reason: 'unavailable',
      })
    );

    expect(failed).toHaveLength(1);
    expect(hook.current.status).toBe('ready');
    expect(hook.current.identity).toEqual({ displayName: 'Anna Koval', monogram: 'AK' });
  });

  it('clears the previous identity when a later read ends the session', async () => {
    answerWith('Anna Koval');
    const hook = mountCurrentUser();
    await waitFor(() => expect(hook.current.status).toBe('ready'));

    const ended = answerProfileOperation('CurrentUser', {
      respond: () => new HttpResponse(null, { status: 401 }),
    });
    act(() => hook.current.go('/settings'));
    await waitFor(() => expect(ended).toHaveLength(1));
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());

    await waitFor(() => expect(hook.current.status).toBe('pending'));
    expect(hook.current.identity).toBeNull();
  });

  it('sign out then a second user shows no stale name', async () => {
    const nameA = buildFullName();
    const nameB = buildFullName();
    const displayNameA = new UserDisplayNameMapper().fromFullName(nameA).displayName;
    const displayNameB = new UserDisplayNameMapper().fromFullName(nameB).displayName;
    expect(displayNameA).not.toBe(displayNameB);
    const rendered: Array<string | undefined> = [];
    answerWith(nameA);
    const { result } = renderHook(
      () => {
        const state = useCurrentUser();
        rendered.push(state.identity?.displayName);

        return state;
      },
      { wrapper: guardedWrapper }
    );
    await waitFor(() => expect(result.current.identity?.displayName).toBe(displayNameA));

    act(() => authSessionProvider.signOut());
    const afterSignOut = rendered.length;
    answerWith(nameB);
    act(() => useAuthStore.setState({ token: buildToken() }));
    await waitFor(() => expect(result.current.identity?.displayName).toBe(displayNameB));

    expect(rendered.slice(afterSignOut)).not.toContain(displayNameA);
    expect(rendered.slice(afterSignOut)[0]).toBeUndefined();
  });
});
