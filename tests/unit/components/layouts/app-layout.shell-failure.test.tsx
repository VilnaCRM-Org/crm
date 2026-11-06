import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import testI18n from '@tests/i18n/test-i18n';

const mockShellLoad = jest.fn();

jest.mock('@/components/layouts/app-shell-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockShellLoad() },
}));

const renderLayout = (onShellFailure?: (error: unknown) => void): void => {
  render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={{ signOut: jest.fn() }} />}>
            <Route element={<AppLayout onShellFailure={onShellFailure} />}>
              <Route path="/" element={<h1>Welcome</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
};

const placeholders = (): HTMLElement[] =>
  screen
    .queryAllByRole('generic', { hidden: true })
    .filter((element) => element.getAttribute('aria-hidden') === 'true')
    .filter((element) => window.getComputedStyle(element).minHeight !== '4.125rem');

describe('AppLayout when the ui-app-shell chunk cannot load', () => {
  afterEach(() => {
    mockShellLoad.mockReset();
    jest.restoreAllMocks();
  });

  it('keeps the two placeholders and the page, and reports the failure once', async () => {
    const failure = new Error('Loading chunk ui-app-shell failed.');
    const onShellFailure = jest.fn();
    const reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
    mockShellLoad.mockRejectedValue(failure);

    renderLayout(onShellFailure);
    await waitFor(() => expect(onShellFailure).toHaveBeenCalledTimes(1));

    expect(onShellFailure).toHaveBeenCalledWith(failure);
    expect(placeholders()).toHaveLength(2);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
    expect(mockShellLoad).toHaveBeenCalledTimes(1);
  });

  it('tolerates a missing failure handler', async () => {
    mockShellLoad.mockRejectedValue(new Error('boom'));

    renderLayout();
    await waitFor(() => expect(mockShellLoad).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(placeholders()).toHaveLength(2));
    expect(screen.getByRole('main')).toHaveTextContent('Welcome');
  });
});
