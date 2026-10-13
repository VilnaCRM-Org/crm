import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { type JSX, StrictMode } from 'react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';

import useResetToken from '@auth/hooks/use-reset-token';
import { buildResetToken, buildToken } from '@tests/builders';

const seen: Array<string | null> = [];

function Probe(): JSX.Element {
  const token = useResetToken();
  const { search } = useLocation();
  seen.push(token);
  return <p>{`search=${search}`}</p>;
}

type MemoryRouter = ReturnType<typeof createMemoryRouter>;

const routerAt = (entry: string): MemoryRouter =>
  createMemoryRouter([{ path: '/password-reset', element: <Probe /> }], {
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
    mountAt(`/password-reset?token=${token}`);
    await screen.findByText('search=');
    expect(lastToken()).toBe(token);

    seen.length = 0;
    document.body.innerHTML = '';
    mountAt(`/password-reset?token=${token}`);
    await screen.findByText('search=');

    expect(lastToken()).toBe(token);
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
