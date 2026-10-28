import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';

import '../../../../setup';
import useCurrentUser from '@/modules/user/features/settings/hooks/use-current-user';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken, buildUserNode } from '@tests/builders';

import { answerProfileOperation } from '../../../../mocks/profile-operations';
import server from '../../../../mocks/server';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
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

describe('useCurrentUser over the container (integration)', () => {
  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token: buildToken() });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('starts name-less and pending, then shows the monogram and display name', async () => {
    answerWith('Anna Koval');

    const hook = mountCurrentUser();

    expect(hook.current.status).toBe('pending');
    expect(hook.current.identity).toBeNull();
    await waitFor(() => expect(hook.current.status).toBe('ready'));
    expect(hook.current.identity).toEqual({ displayName: 'Anna Koval', monogram: 'AK' });
  });

  it('turns a three-word full name into first name, last name and their initials', async () => {
    answerWith('Koval Anna Petrivna');

    const hook = mountCurrentUser();

    await waitFor(() => expect(hook.current.status).toBe('ready'));
    expect(hook.current.identity).toEqual({ displayName: 'Anna Koval', monogram: 'AK' });
  });

  it('drops the answer of a read that a pathname change replaced', async () => {
    answerProfileOperation('CurrentUser', {
      respond: () =>
        HttpResponse.json({
          data: { users: { edges: [{ node: buildUserNode({ initials: 'Old Name' }) }] } },
        }),
      delayMs: 150,
    });
    const hook = mountCurrentUser();
    answerWith('Anna Koval');

    act(() => hook.current.go('/settings'));
    await waitFor(() => expect(hook.current.identity?.displayName).toBe('Anna Koval'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)));

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
    answerWith('Anna Koval');
    const hook = mountCurrentUser();
    await waitFor(() => expect(hook.current.status).toBe('ready'));

    const failed = answerProfileOperation('CurrentUser', {
      respond: () => new HttpResponse(null, { status: 400 }),
    });
    act(() => hook.current.go('/settings'));
    await waitFor(() => expect(failed).toHaveLength(1));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

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
});
