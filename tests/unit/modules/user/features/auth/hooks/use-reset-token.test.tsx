import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { type JSX, StrictMode } from 'react';
import * as ReactRouter from 'react-router';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';

import useCreateNewPassword from '@auth/hooks/use-create-new-password';
import useResetToken from '@auth/hooks/use-reset-token';
import type { AuthProviderLoader } from '@auth/stores';
import type { CreateNewPasswordOutcome } from '@auth/types/password-recovery/outcome';
import { buildPassword, buildResetToken, buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const seen: Array<string | null> = [];

function Probe(): JSX.Element {
  const token = useResetToken();
  const { search } = useLocation();
  seen.push(token);
  return <p>{`search=${search}`}</p>;
}

const INVALID_LINK: CreateNewPasswordOutcome = {
  kind: 'failed',
  failure: { reason: 'invalid_link', retryable: false },
};

const confirmReset = jest.fn<Promise<CreateNewPasswordOutcome>, []>();

const loader = {
  resolve: async () => ({ confirmReset }),
} as unknown as AuthProviderLoader;

function Confirmer(): JSX.Element {
  const token = useResetToken();
  const state = useCreateNewPassword(loader);
  seen.push(token);
  if (token === null || state.view === 'invalid') return <p>invalid link</p>;
  const { callbacks } = state;
  return (
    <button
      type="button"
      onClick={() => void callbacks.submit({ token, newPassword: buildPassword() })}
    >
      Confirm
    </button>
  );
}

type MemoryRouter = ReturnType<typeof createMemoryRouter>;

const routerAt = (entry: string, element: JSX.Element = <Probe />): MemoryRouter =>
  createMemoryRouter([{ path: '/password-reset', element }], {
    initialEntries: [entry],
  });

const mount = (router: MemoryRouter, strict = false): MemoryRouter => {
  const tree = <RouterProvider router={router} />;
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return router;
};

const mountAt = (entry: string): MemoryRouter => mount(routerAt(entry));

const lastToken = (): string | null | undefined => seen[seen.length - 1];

describe('useResetToken', () => {
  beforeEach(() => {
    seen.length = 0;
  });

  it('returns the trimmed token and strips it from the location', async () => {
    const token = buildResetToken();
    const router = mountAt(`/password-reset?token=%20${token}%20`);

    expect(await screen.findByText('search=')).toBeInTheDocument();
    expect(lastToken()).toBe(token);
    expect(router.state.location.pathname).toBe('/password-reset');
    expect(router.state.location.search).toBe('');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('rejects a session JWT, which is longer than a reset token may be', async () => {
    mountAt(`/password-reset?token=${encodeURIComponent(buildToken())}`);

    await screen.findByText('search=');
    expect(lastToken()).toBeNull();
  });

  it.each([
    ['no token', '/password-reset'],
    ['an empty token', '/password-reset?token='],
    ['a blank token', '/password-reset?token=%20%20'],
    ['a 256-character token', `/password-reset?token=${'a'.repeat(256)}`],
  ])('returns null for %s', async (_name, entry) => {
    mountAt(entry);

    await screen.findByText('search=');
    expect(lastToken()).toBeNull();
  });

  it('accepts exactly 255 characters', async () => {
    mountAt(`/password-reset?token=${'a'.repeat(255)}`);

    await screen.findByText('search=');
    expect(lastToken()).toBe('a'.repeat(255));
  });

  it('does not navigate without a token parameter', async () => {
    const router = mountAt('/password-reset');

    await screen.findByText('search=');
    expect(router.state.historyAction).toBe('POP');
  });

  it('keeps the token across the StrictMode remount and replaces once', async () => {
    const token = buildResetToken();
    const router = routerAt(`/password-reset?token=${token}`);
    const navigate = jest.spyOn(router, 'navigate');
    mount(router, true);

    await screen.findByText('search=');
    expect(lastToken()).toBe(token);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('reads and strips the token again when the same URL is opened twice', async () => {
    const token = buildResetToken();
    const { unmount } = render(
      <RouterProvider router={routerAt(`/password-reset?token=${token}`)} />
    );
    await screen.findByText('search=');
    expect(lastToken()).toBe(token);

    seen.length = 0;
    unmount();
    mountAt(`/password-reset?token=${token}`);
    await screen.findByText('search=');

    expect(lastToken()).toBe(token);
  });

  it('shows the invalid link when the confirm step reports it', async () => {
    confirmReset.mockReset().mockResolvedValue(INVALID_LINK);
    const token = buildResetToken();
    mount(routerAt(`/password-reset?token=${token}`, <Confirmer />));

    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('invalid link')).toBeInTheDocument();
    expect(lastToken()).toBe(token);
    expect(confirmReset).toHaveBeenCalledTimes(1);
  });

  it('strips a token that arrives by in-app navigation after mount', async () => {
    const router = mountAt('/password-reset');
    await screen.findByText('search=');

    await act(() => router.navigate(`/password-reset?token=${buildResetToken()}`));

    expect(router.state.location.search).toBe('');
    expect(router.state.historyAction).toBe('REPLACE');
    expect(lastToken()).toBeNull();
  });

  it('leaves the token out of the document, the title and web storage', async () => {
    const token = buildResetToken();
    mountAt(`/password-reset?token=${token}`);
    await screen.findByText('search=');

    expect(document.title).not.toContain(token);
    expect(document.body.innerHTML).not.toContain(token);
    expect(JSON.stringify({ ...localStorage })).not.toContain(token);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(token);
  });
});

describe('useResetToken loaded inside the test', () => {
  it('evaluates the parameter name and length bound it reads the token with', async () => {
    const freshUseResetToken = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-router', () => ReactRouter);
      return (await import('@auth/hooks/use-reset-token')).default;
    });
    const tokens: Array<string | null> = [];
    function FreshProbe(): JSX.Element {
      const token = freshUseResetToken();
      const { search } = useLocation();
      tokens.push(token);
      return <p>{`search=${search}`}</p>;
    }
    const token = 'a'.repeat(255);
    const router = mount(routerAt(`/password-reset?token=${token}`, <FreshProbe />));

    expect(await screen.findByText('search=')).toBeInTheDocument();
    expect(tokens.at(-1)).toBe(token);
    expect(router.state.historyAction).toBe('REPLACE');
  });
});
