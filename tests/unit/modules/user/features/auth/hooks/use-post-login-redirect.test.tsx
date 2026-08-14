import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import usePostLoginRedirect from '@auth/hooks/use-post-login-redirect';
import useAuthToken from '@auth/stores/use-auth-token';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: (): jest.Mock => mockNavigate,
}));

jest.mock('@auth/stores/use-auth-token', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseAuthToken = useAuthToken as jest.Mock;

function Probe(): null {
  usePostLoginRedirect();
  return null;
}

type Entry = Parameters<typeof MemoryRouter>[0]['initialEntries'];

function renderProbe(entries: Entry = ['/sign-in']): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={entries}>
      <Probe />
    </MemoryRouter>
  );
}

describe('usePostLoginRedirect', () => {
  it('redirects home after a null-to-token transition and marks the target for focus', () => {
    mockUseAuthToken.mockReturnValue(null);
    const view = renderProbe();
    expect(mockNavigate).not.toHaveBeenCalled();

    mockUseAuthToken.mockReturnValue('fresh-token');
    view.rerender(
      <MemoryRouter initialEntries={['/sign-in']}>
        <Probe />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      replace: true,
      state: { focusMain: true },
    });
  });

  it('redirects back to the preserved location from the router state', () => {
    mockUseAuthToken.mockReturnValue(null);
    const entries = [
      { pathname: '/sign-in', state: { from: { pathname: '/deals', search: '?tab=open' } } },
    ] as Entry;
    const view = renderProbe(entries);

    mockUseAuthToken.mockReturnValue('fresh-token');
    view.rerender(
      <MemoryRouter initialEntries={entries}>
        <Probe />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/deals?tab=open', {
      replace: true,
      state: { focusMain: true },
    });
  });

  it('never redirects when the page mounts with a token already present', () => {
    mockUseAuthToken.mockReturnValue('seeded-token');
    const view = renderProbe();

    view.rerender(
      <MemoryRouter initialEntries={['/sign-in']}>
        <Probe />
      </MemoryRouter>
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('never redirects while the token stays null', () => {
    mockUseAuthToken.mockReturnValue(null);
    const view = renderProbe();

    view.rerender(
      <MemoryRouter initialEntries={['/sign-in']}>
        <Probe />
      </MemoryRouter>
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('re-arms after a logout and redirects only once per fresh login', () => {
    mockUseAuthToken.mockReturnValue('seeded-token');
    const view = renderProbe();
    const rerenderWith = (token: string | null): void => {
      mockUseAuthToken.mockReturnValue(token);
      view.rerender(
        <MemoryRouter initialEntries={['/sign-in']}>
          <Probe />
        </MemoryRouter>
      );
    };

    rerenderWith(null);
    expect(mockNavigate).not.toHaveBeenCalled();

    rerenderWith('relogin-token');
    expect(mockNavigate).toHaveBeenCalledTimes(1);

    rerenderWith('rotated-token');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
