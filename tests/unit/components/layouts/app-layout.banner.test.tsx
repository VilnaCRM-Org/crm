import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';
import testI18n from '@tests/i18n/test-i18n';

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <footer>shell footer</footer>,
}));

jest.mock('@/components/layouts/app-shell-loader', () => ({
  __esModule: true,
  default: {
    load: (): Promise<unknown> =>
      Promise.resolve({ default: (): ReactElement => <nav aria-label="shell">shell</nav> }),
  },
}));

const context = (banner?: ProtectedOutletContext['banner']): ProtectedOutletContext => ({
  signOut: jest.fn(),
  twoFactorStatus: 'unknown',
  setTwoFactorStatus: jest.fn(),
  banner,
});

const mount = async (banner?: ProtectedOutletContext['banner']): Promise<void> => {
  render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={context(banner)} />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<h1>page</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
  await screen.findByRole('contentinfo');
};

describe('AppLayout banner slot', () => {
  it('renders the banner as the first child of main, before the page', async () => {
    await mount(<p>low codes</p>);

    const main = screen.getByRole('main');
    const banner = screen.getByText('low codes');
    expect(main).toContainElement(banner);
    expect(banner.compareDocumentPosition(screen.getByRole('heading', { name: 'page' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('leaves main holding only the page when there is no banner', async () => {
    await mount();

    expect(screen.getByRole('main')).toHaveTextContent(/^page$/);
  });

  it('does not move focus to the banner', async () => {
    await mount(<button type="button">dismiss</button>);

    expect(screen.getByRole('button', { name: 'dismiss' })).not.toHaveFocus();
  });
});
