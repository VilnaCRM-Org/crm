import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { MemoryRouter } from 'react-router';

import usePostLoginRedirect from '@auth/hooks/use-post-login-redirect';
import useAuthToken from '@auth/stores/use-auth-token';

const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: (): jest.Mock => mockNavigate,
}));

jest.mock('@auth/stores/use-auth-token', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseAuthToken = useAuthToken as jest.Mock;

function Probe(): JSX.Element {
  const { signedIn, proceed } = usePostLoginRedirect();
  return (
    <button type="button" onClick={proceed}>
      {`signed in: ${String(signedIn)}`}
    </button>
  );
}

type Entry = NonNullable<Parameters<typeof MemoryRouter>[0]['initialEntries']>;

function mountProbe(entries: Entry = ['/sign-in']): (token: string | null) => void {
  const view = render(
    <MemoryRouter initialEntries={entries}>
      <Probe />
    </MemoryRouter>
  );
  return (token: string | null): void => {
    mockUseAuthToken.mockReturnValue(token);
    view.rerender(
      <MemoryRouter initialEntries={entries}>
        <Probe />
      </MemoryRouter>
    );
  };
}

const button = (signedIn: boolean): HTMLElement =>
  screen.getByRole('button', { name: `signed in: ${String(signedIn)}` });

describe('usePostLoginRedirect', () => {
  beforeEach(() => mockNavigate.mockReset());

  it('reports a sign-in after a null-to-token transition without navigating by itself', () => {
    mockUseAuthToken.mockReturnValue(null);
    const rerenderWith = mountProbe();
    expect(button(false)).toBeInTheDocument();

    rerenderWith('fresh-token');

    expect(button(true)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('proceeds home and marks the target for focus', async () => {
    mockUseAuthToken.mockReturnValue(null);
    const rerenderWith = mountProbe();
    rerenderWith('fresh-token');

    await userEvent.click(button(true));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      replace: true,
      state: { focusMain: true },
    });
  });

  it('proceeds back to the preserved location from the router state', async () => {
    mockUseAuthToken.mockReturnValue(null);
    const entries = [
      { pathname: '/sign-in', state: { from: { pathname: '/deals', search: '?tab=open' } } },
    ] as Entry;
    const rerenderWith = mountProbe(entries);
    rerenderWith('fresh-token');

    await userEvent.click(button(true));

    expect(mockNavigate).toHaveBeenCalledWith('/deals?tab=open', {
      replace: true,
      state: { focusMain: true },
    });
  });

  it('never reports a sign-in when the page mounts with a token already present', () => {
    mockUseAuthToken.mockReturnValue('seeded-token');
    const rerenderWith = mountProbe();

    rerenderWith('seeded-token');

    expect(button(false)).toBeInTheDocument();
  });

  it('never reports a sign-in while the token stays null', () => {
    mockUseAuthToken.mockReturnValue(null);
    const rerenderWith = mountProbe();

    rerenderWith(null);

    expect(button(false)).toBeInTheDocument();
  });

  it('re-arms after a logout and reports each fresh login', () => {
    mockUseAuthToken.mockReturnValue('seeded-token');
    const rerenderWith = mountProbe();

    rerenderWith(null);
    expect(button(false)).toBeInTheDocument();

    rerenderWith('relogin-token');
    expect(button(true)).toBeInTheDocument();

    rerenderWith('rotated-token');
    expect(button(true)).toBeInTheDocument();

    rerenderWith(null);
    expect(button(false)).toBeInTheDocument();
  });
});
