// @jest-environment jsdom

import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
  useLocation,
} from 'react-router';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import ROUTE_PATHS from '@/routes/route-paths';
import TwoFactorChallenge from '@auth/routes/two-factor';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import signInSubmitHandler from '@auth/utils/sign-in-submit-handler';
import { buildEmail, buildPassword, buildPendingSessionId, buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockLoadSection = jest.fn();
const mockLayout = jest.fn();

jest.mock('@auth/routes/two-factor/form-section-loader', () => ({
  __esModule: true,
  default: { load: (): unknown => mockLoadSection() },
}));

jest.mock('@auth/components/recovery-page-layout', () => ({
  __esModule: true,
  default: ({ titleKey, children }: { titleKey: string; children: ReactNode }): JSX.Element => {
    mockLayout(titleKey);
    return <main>{children}</main>;
  },
}));

function Probe(): JSX.Element {
  const { pathname, search, state } = useLocation();
  return <p>{`${pathname}${search}|${JSON.stringify(state)}`}</p>;
}

const mount = (state: object | null = null): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[{ pathname: ROUTE_PATHS.twoFactorChallenge, state }]}>
      <Routes>
        <Route path={ROUTE_PATHS.twoFactorChallenge} element={<TwoFactorChallenge />} />
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );

describe('TwoFactorChallenge page', () => {
  beforeEach(() => {
    resetClientStores();
    mockLoadSection.mockReset();
    mockLayout.mockReset();
    mockLoadSection.mockResolvedValue({ default: () => <p>challenge section</p> });
  });

  it('renders the lazy section in the recovery layout when a session is pending', async () => {
    useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });

    mount();

    expect(await screen.findByText('challenge section')).toBeInTheDocument();
    expect(mockLayout).toHaveBeenCalledWith('two_factor.title');
    expect(mockLoadSection).toHaveBeenCalledTimes(1);
  });

  it.each([[null], [{ from: { pathname: '/boards' } }]])(
    'replaces the entry with sign-in, no notice and no section load, without a session (state %j)',
    async (state) => {
      mount(state);

      expect(await screen.findByText(`${ROUTE_PATHS.signIn}|null`)).toBeInTheDocument();
      expect(mockLoadSection).not.toHaveBeenCalled();
      expect(mockLayout).not.toHaveBeenCalled();
    }
  );

  it('sends a signed-in visitor without a session to sign-in as well', async () => {
    useAuthStore.setState({ token: buildToken() });

    mount();

    expect(await screen.findByText(`${ROUTE_PATHS.signIn}|null`)).toBeInTheDocument();
  });

  it('renders nothing and proceeds to the from target when the challenge completes', async () => {
    useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });
    const from = { pathname: '/deals', search: '?tab=open' };
    mount({ from });
    await screen.findByText('challenge section');

    act(() => useAuthStore.setState({ pendingSessionId: null, token: buildToken() }));

    const landed = await screen.findByText(/^\/deals\?tab=open\|/);
    expect(landed).toHaveTextContent('{"focusMain":true}');
    expect(screen.queryByText('challenge section')).not.toBeInTheDocument();
  });

  it('proceeds home after a sign-in challenge issued while an earlier token was held', async () => {
    useAuthStore.setState({ token: buildToken() });
    const pendingSessionId = buildPendingSessionId();
    const login = jest.fn().mockResolvedValue({
      ok: true,
      value: { kind: 'challenge', email: buildEmail(), pendingSessionId },
    });
    const resolve = jest.fn().mockResolvedValue({ login, loginSettled: jest.fn() });
    await signInSubmitHandler.run(
      {
        loader: { resolve } as unknown as AuthProviderLoader,
        store: useAuthStore,
        demoSession: sandboxDemoSessionProvider,
      },
      { email: buildEmail(), password: buildPassword() },
      new AbortController().signal
    );
    mount();
    await screen.findByText('challenge section');

    act(() => useAuthStore.setState({ pendingSessionId: null, token: buildToken() }));

    expect(await screen.findByText(`${ROUTE_PATHS.home}|{"focusMain":true}`)).toBeInTheDocument();
  });

  it('goes straight to the from target without passing through sign-in on completion', async () => {
    useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });
    const router = createMemoryRouter(
      [
        { path: ROUTE_PATHS.twoFactorChallenge, element: <TwoFactorChallenge /> },
        { path: '*', element: <Probe /> },
      ],
      {
        initialEntries: [
          { pathname: ROUTE_PATHS.twoFactorChallenge, state: { from: { pathname: '/deals' } } },
        ],
      }
    );
    const visited: string[] = [];
    router.subscribe((routerState) => visited.push(routerState.location.pathname));
    render(<RouterProvider router={router} />);
    await screen.findByText('challenge section');

    act(() => useAuthStore.setState({ pendingSessionId: null, token: buildToken() }));

    expect(await screen.findByText('/deals|{"focusMain":true}')).toBeInTheDocument();
    expect(visited).toEqual(['/deals']);
  });

  it('sends the visitor to sign-in when the pending session ends without a token', async () => {
    useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });
    mount();
    await screen.findByText('challenge section');

    act(() => useAuthStore.setState({ pendingSessionId: null }));

    expect(await screen.findByText(`${ROUTE_PATHS.signIn}|null`)).toBeInTheDocument();
  });

  it('proceeds to the home route when the challenge arrived without a from target', async () => {
    useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });
    mount();
    await screen.findByText('challenge section');

    act(() => useAuthStore.setState({ pendingSessionId: null, token: buildToken() }));

    expect(await screen.findByText(`${ROUTE_PATHS.home}|{"focusMain":true}`)).toBeInTheDocument();
  });
});
