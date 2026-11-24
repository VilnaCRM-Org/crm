import { render, screen, waitFor } from '@testing-library/react';
import type { JSX, ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import AppLayoutFrame from '@/components/layouts/app-layout-frame';
import type { AppShellModuleLoader } from '@/components/types/layouts/app-layout-frame';
import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import type { ShellFailureHandler, UserMenuSlot } from '@/routes/types/shell-slot';
import testI18n from '@tests/i18n/test-i18n';

jest.mock('@/components/layouts/footer-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => new Promise(() => undefined) },
}));

function LoadedShell({ signOut, userMenu: UserMenu }: UIAppShellProps): ReactElement {
  return (
    <header>
      <button type="button" onClick={signOut}>
        shell sign out
      </button>
      {UserMenu === undefined ? null : <UserMenu signOut={signOut} onAvatar={jest.fn()} />}
    </header>
  );
}

function StubUserMenu(): JSX.Element {
  return <span>user menu</span>;
}

const loaderOf = (load: AppShellModuleLoader['load']): AppShellModuleLoader => ({ load });

function renderFrame(
  shellLoader: AppShellModuleLoader,
  onShellFailure?: ShellFailureHandler,
  userMenu?: UserMenuSlot
): { signOut: jest.Mock } {
  const signOut = jest.fn();
  render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={{ signOut }} />}>
            <Route
              element={
                <AppLayoutFrame
                  shellLoader={shellLoader}
                  onShellFailure={onShellFailure}
                  userMenu={userMenu}
                />
              }
            >
              <Route path="/" element={<h1>Welcome</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

  return { signOut };
}

const shellPlaceholders = (): HTMLElement[] =>
  screen
    .queryAllByRole('generic', { hidden: true })
    .filter((element) => element.getAttribute('aria-hidden') === 'true')
    .filter((element) => window.getComputedStyle(element).minHeight !== '4.125rem');

describe('AppLayoutFrame', () => {
  it('holds the two shell placeholders while the shell loader has not settled', () => {
    const load = jest.fn((): Promise<never> => new Promise(() => undefined));

    renderFrame(loaderOf(load));

    expect(shellPlaceholders()).toHaveLength(2);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Welcome');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the placeholders and reports the failure when the shell loader rejects', async () => {
    const failure = new Error('Loading chunk ui-app-shell failed.');
    const onShellFailure = jest.fn();

    renderFrame(
      loaderOf(() => Promise.reject(failure)),
      onShellFailure
    );
    await waitFor(() => expect(onShellFailure).toHaveBeenCalledTimes(1));

    expect(onShellFailure).toHaveBeenCalledWith(failure);
    expect(shellPlaceholders()).toHaveLength(2);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Welcome');
  });

  it('renders the loaded shell with the outlet sign-out and the user-menu slot', async () => {
    const { signOut } = renderFrame(
      loaderOf(() => Promise.resolve({ default: LoadedShell })),
      undefined,
      StubUserMenu
    );

    const button = await screen.findByRole('button', { name: 'shell sign out' });
    button.click();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('banner')).toHaveTextContent('user menu');
    expect(shellPlaceholders()).toHaveLength(0);
  });
});
