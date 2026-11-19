import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type ReactNode, StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import SocialCallback from '@auth/routes/social-callback';
import type {
  SocialSignInOutcome,
  SocialStartOutcome,
} from '@auth/types/social-sign-in/social-sign-in-outcome';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const mockStart = jest.fn<Promise<SocialStartOutcome>, unknown[]>();
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
const AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth?state=issued';

const page = (path: string, state: unknown): JSX.Element => (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
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

const visit = (path: string, search = '', state: unknown = null): ReturnType<typeof render> => {
  window.history.replaceState({ idx: 3 }, '', `${path}${search}`);
  return render(page(path, state));
};

const startFlow = (path = CALLBACK): ReturnType<typeof render> =>
  visit(path, '', { socialStart: true });

// A provider redirect back for a state this tab started with.
const returnFrom = (provider: string, query: Record<string, string>): ReturnType<typeof render> => {
  const state = query.state ?? nextState();
  socialSignInFlowSource.saveState({ provider, state });
  const search = new URLSearchParams({ ...query, state }).toString();
  return visit(`/auth/callback/${provider}`, `?${search}`);
};

describe('SocialCallback page', () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockComplete.mockReset();
    mockResolve.mockReset().mockResolvedValue({ start: mockStart, complete: mockComplete });
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    jest.restoreAllMocks();
  });

  describe('starting from a provider button', () => {
    it('asks user-service once for the authorization URL, saves its state and leaves', async () => {
      const leave = jest.spyOn(socialSignInNavigator, 'leave').mockImplementation(() => undefined);
      mockStart.mockResolvedValue({
        kind: 'redirect',
        authorizationUrl: AUTHORIZE,
        state: 'issued',
      });

      startFlow();

      await waitFor(() => expect(leave).toHaveBeenCalledWith(AUTHORIZE));
      expect(mockStart).toHaveBeenCalledTimes(1);
      expect(mockStart).toHaveBeenCalledWith('google', expect.any(AbortSignal));
      expect(socialSignInFlowSource.matchesState({ provider: 'google', state: 'issued' })).toBe(
        true
      );
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Виконуємо вхід через Google…');
      expect(heading).toHaveStyle({ fontSize: '1.375rem', fontWeight: '700' });
    });

    it('shows a failed start with a retry that starts the same provider again', async () => {
      const restart = jest
        .spyOn(socialSignInNavigator, 'restart')
        .mockImplementation(() => undefined);
      mockStart.mockResolvedValue({ kind: 'failed', error: 'unavailable' });

      startFlow('/auth/callback/github');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Не вдалося увійти через GitHub' })
      ).toHaveFocus();
      await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
      expect(restart).toHaveBeenCalledWith('github', expect.any(Function));
    });

    it('treats a start that never answered as the service being unavailable', async () => {
      mockStart.mockResolvedValue({ kind: 'aborted' });

      startFlow();

      expect(await screen.findByText(/зараз не відповідає/)).toBeInTheDocument();
    });
  });

  describe('returning from the provider', () => {
    it('relays code and state once under StrictMode and lands on the saved page', async () => {
      window.sessionStorage.setItem('crm.socialSignIn.destination', '/orders');
      mockComplete.mockResolvedValue({ kind: 'signed-in' });

      returnFrom('google', { code: 'c-1', state: 's-1' });

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

      returnFrom('google', { code: 'c-1' });

      await screen.findByRole('heading', { name: 'home page' });
      expect(window.location.search).toBe('');
      expect(window.location.pathname).toBe(CALLBACK);
      expect(window.history.state).toEqual({ idx: 3 });
    });

    it('refuses a state this tab never started, without calling user-service', async () => {
      socialSignInFlowSource.saveState({ provider: 'google', state: 'mine' });

      visit(CALLBACK, '?code=c&state=forged');

      expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
      expect(mockResolve).not.toHaveBeenCalled();
    });

    it('refuses a state started for another provider', async () => {
      socialSignInFlowSource.saveState({ provider: 'github', state: 'shared' });

      visit(CALLBACK, '?code=c&state=shared');

      expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
    });

    it('announces the sign-in in progress with the provider name', async () => {
      mockComplete.mockReturnValue(new Promise(() => undefined));

      returnFrom('google', { code: 'c' });

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

      returnFrom('google', { code: 'c' });

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Не вдалося увійти через Google' })
      ).toHaveFocus();
      expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
      expect(restart).toHaveBeenCalledWith('google', expect.any(Function));
    });

    it('tells a 2FA account to finish with its password for now', async () => {
      mockComplete.mockResolvedValue({ kind: 'two-factor', pendingSessionId: 'p-1' });

      returnFrom('github', { code: 'c' });

      expect(await screen.findByText(/захищено двофакторною автентифікацією/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('GitHub');
    });

    it('treats a completion that never answered as the service being unavailable', async () => {
      mockComplete.mockResolvedValue({ kind: 'aborted' });

      returnFrom('google', { code: 'c' });

      expect(await screen.findByText(/зараз не відповідає/)).toBeInTheDocument();
    });

    it('reports the service as unavailable when the auth module cannot load', async () => {
      mockResolve.mockRejectedValue(new Error('chunk failed'));

      returnFrom('google', { code: 'c' });

      expect(await screen.findByText(/зараз не відповідає/)).toBeInTheDocument();
    });

    it('ignores a result that settles after the page unmounted', async () => {
      let settle: (outcome: SocialSignInOutcome) => void = () => undefined;
      mockComplete.mockReturnValue(
        new Promise((resolve) => {
          settle = resolve;
        })
      );
      const { unmount } = returnFrom('google', { code: 'c', state: 'late' });
      await waitFor(() => expect(mockComplete).toHaveBeenCalled());

      unmount();
      await act(async () => settle({ kind: 'failed', error: 'expired' }));

      expect(screen.queryByText(EXPIRED)).not.toBeInTheDocument();
    });
  });

  it('shows a cancelled sign-in without calling user-service', async () => {
    visit(CALLBACK, `?error=access_denied&state=${nextState()}`);

    expect(await screen.findByText(/скасовано/)).toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it.each([
    ['no code', '?state=lonely'],
    ['no state', '?code=c'],
    ['no query at all', ''],
  ])('shows missing parameters for %s without calling user-service', async (_label, search) => {
    visit(CALLBACK, search);

    expect(await screen.findByText(/не повернув даних для входу/)).toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('refuses an unknown provider segment without echoing it or offering a retry', async () => {
    startFlow('/auth/callback/myspace');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Не вдалося увійти через цей сервіс'
    );
    expect(screen.queryByText(/myspace/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mockResolve).not.toHaveBeenCalled();
  });
});
