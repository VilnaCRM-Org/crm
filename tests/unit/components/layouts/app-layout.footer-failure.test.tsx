import { render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import testI18n from '@tests/i18n/test-i18n';

const mockFooterLoad = jest.fn();

jest.mock('@/components/layouts/footer-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockFooterLoad() },
}));

function Page(): JSX.Element {
  return (
    <>
      <h1>Welcome</h1>
      <button type="button">Sign out</button>
    </>
  );
}

function footerPlaceholders(): HTMLElement[] {
  return screen
    .queryAllByRole('generic', { hidden: true })
    .filter((element) => window.getComputedStyle(element).minHeight === '4.125rem');
}

describe('AppLayout when the footer chunk cannot load', () => {
  it('drops the footer and keeps the protected page in place', async () => {
    mockFooterLoad.mockRejectedValue(new Error('Loading chunk ui-footer failed.'));

    render(
      <I18nextProvider i18n={testI18n}>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={{ signOut: jest.fn() }} />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Page />} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(footerPlaceholders()).toHaveLength(1);

    await waitFor(() => expect(mockFooterLoad).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(footerPlaceholders()).toHaveLength(0));

    const main = screen.getByRole('main');

    expect(main).toContainElement(screen.getByRole('heading', { level: 1, name: 'Welcome' }));
    expect(main).toContainElement(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
