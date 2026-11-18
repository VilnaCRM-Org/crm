import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type ReactNode, StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import SocialCallback from '@auth/routes/social-callback';
import { useAuthStore } from '@auth/stores';
import type { SocialSignInOutcome } from '@auth/types/social-sign-in/social-sign-in-outcome';
import socialSignInDestinationSource from '@auth/utils/social-sign-in-destination-source';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const mockComplete = jest.fn<Promise<SocialSignInOutcome>, unknown[]>();
const mockResolve = jest.fn();

// Stable across renders, like the real hook, which keeps its loader in useState.
const mockLoader = { resolve: mockResolve };

jest.mock('@auth/hooks/use-auth-provider-loader', () => ({
  __esModule: true,
  default: (): { resolve: jest.Mock } => mockLoader,
}));

jest.mock('@auth/components/auth-page-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }): JSX.Element => <main>{children}</main>,
}));

const i18n = createLocaleI18n('uk');

const CALLBACK = '/auth/callback/google';
const EXPIRED = 'Спроба входу застаріла або вже використана. Спробуйте ще раз.';

const page = (path: string): JSX.Element => (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/auth/callback/:provider" element={<SocialCallback />} />
          <Route path="/" element={<h1>home page</h1>} />
          <Route path="/orders" element={<h1>orders page</h1>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  </StrictMode>
);

let stateCounter = 0;
const nextState = (): string => {
  stateCounter += 1;
  return `state-${stateCounter}`;
};

const visit = (path: string, search = ''): ReturnType<typeof render> => {
  window.history.replaceState({ idx: 3 }, '', `${path}${search}`);
  return render(page(path));
};

describe('SocialCallback page', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null });
    mockComplete.mockReset();
    mockResolve.mockReset().mockResolvedValue({ complete: mockComplete });
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    jest.restoreAllMocks();
  });

  it('relays code and state once, even under StrictMode, and lands on the saved page', async () => {
    window.sessionStorage.setItem('crm.socialSignIn.destination', '/orders');
    mockComplete.mockResolvedValue({ kind: 'signed-in' });

    visit(CALLBACK, '?code=c-1&state=s-1');

    expect(await screen.findByRole('heading', { name: 'orders page' })).toBeInTheDocument();
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockComplete).toHaveBeenCalledWith(
      'google',
      { code: 'c-1', state: 's-1' },
      expect.any(AbortSignal)
    );
  });

  it('strips the code and state from the address bar and keeps the history state', async () => {
    mockComplete.mockResolvedValue({ kind: 'signed-in' });

    visit(CALLBACK, '?code=c-1&state=s-1');

    await screen.findByRole('heading', { name: 'home page' });
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe(CALLBACK);
    expect(window.history.state).toEqual({ idx: 3 });
  });

  it('announces the sign-in in progress with the provider name', async () => {
    mockComplete.mockReturnValue(new Promise(() => undefined));

    visit(CALLBACK, `?code=c&state=${nextState()}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Виконуємо вхід через Google…' })
    ).not.toHaveFocus();
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Виконуємо вхід через Google…')
    );
    expect(document.title).toContain('Вхід');
  });

  it('shows the mapped error with a retry that restarts the same provider', async () => {
    const restart = jest
      .spyOn(socialSignInNavigator, 'restart')
      .mockImplementation(() => undefined);
    mockComplete.mockResolvedValue({ kind: 'failed', error: 'expired' });

    visit(CALLBACK, `?code=c&state=${nextState()}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Не вдалося увійти через Google' })
    ).toHaveFocus();
    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    expect(restart).toHaveBeenCalledWith('google');
  });

  it('tells a 2FA account to finish with its password for now', async () => {
    mockComplete.mockResolvedValue({ kind: 'two-factor', pendingSessionId: 'p-1' });

    visit('/auth/callback/github', `?code=c&state=${nextState()}`);

    expect(await screen.findByText(/захищено двофакторною автентифікацією/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('GitHub');
  });

  it('shows a cancelled sign-in without calling the API', async () => {
    visit(CALLBACK, `?error=access_denied&state=${nextState()}`);

    expect(await screen.findByText(/скасовано/)).toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it.each([
    ['no code', `?state=${nextState()}`],
    ['no state', '?code=c'],
    ['no query at all', ''],
  ])('shows missing parameters for %s without calling the API', async (_label, search) => {
    visit(CALLBACK, search);

    expect(await screen.findByText(/не повернув даних для входу/)).toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('refuses an unknown provider segment without echoing it or offering a retry', async () => {
    visit('/auth/callback/myspace', `?code=c&state=${nextState()}`);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Не вдалося увійти через цей сервіс'
    );
    expect(screen.queryByText(/myspace/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('sends an already signed-in user home without calling the API', async () => {
    useAuthStore.setState({ token: 'existing' });
    const take = jest.spyOn(socialSignInDestinationSource, 'take');

    visit(CALLBACK, `?code=c&state=${nextState()}`);

    expect(await screen.findByRole('heading', { name: 'home page' })).toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
    expect(take).not.toHaveBeenCalled();
  });

  it('reports the service as unavailable when the auth module cannot load', async () => {
    mockResolve.mockRejectedValue(new Error('chunk failed'));

    visit(CALLBACK, `?code=c&state=${nextState()}`);

    expect(await screen.findByText(/зараз не відповідає/)).toBeInTheDocument();
  });

  it('keeps waiting when the relay reports an abort', async () => {
    mockComplete.mockResolvedValue({ kind: 'aborted' });

    visit(CALLBACK, `?code=c&state=${nextState()}`);

    await waitFor(() => expect(mockComplete).toHaveBeenCalled());
    await act(async () => undefined);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Виконуємо вхід');
  });

  it('ignores a result that settles after the page unmounted', async () => {
    let settle: (outcome: SocialSignInOutcome) => void = () => undefined;
    mockComplete.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      })
    );
    const { unmount } = visit(CALLBACK, '?code=c&state=late');
    await waitFor(() => expect(mockComplete).toHaveBeenCalled());

    unmount();
    await act(async () => settle({ kind: 'failed', error: 'expired' }));

    expect(screen.queryByText(EXPIRED)).not.toBeInTheDocument();
  });
});
