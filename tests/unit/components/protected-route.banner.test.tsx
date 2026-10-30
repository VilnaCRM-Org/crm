import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router';

import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';
import ProtectedRoute from '@auth/components/protected-route';
import useAuthStore from '@auth/stores/use-auth-store';
import { buildToken } from '@tests/builders';
import testI18n from '@tests/i18n/test-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

jest.mock('@auth/components/recovery-codes-notice', () => ({
  __esModule: true,
  default: ({ count }: { count: number }): JSX.Element => <p>notice for {count}</p>,
}));

jest.mock('@/providers/mui-theme/mui-theme-shell-loader', () => ({
  __esModule: true,
  default: {
    load: (): Promise<unknown> =>
      Promise.resolve({ default: ({ children }: { children: ReactNode }): ReactNode => children }),
  },
}));

function ContextProbe(): JSX.Element {
  const { banner } = useOutletContext<ProtectedOutletContext>();
  return (
    <section aria-label="page">
      <p>banner given:{String(banner !== undefined)}</p>
      {banner}
    </section>
  );
}

const mount = (remaining: number | null): void => {
  act(() => {
    resetClientStores();
    useAuthStore.setState({ token: buildToken(), recoveryCodesRemaining: remaining });
  });
  render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
};

describe('ProtectedRoute banner', () => {
  it('puts no banner in the outlet context without a reported count', () => {
    mount(null);

    expect(screen.getByText('banner given:false')).toBeInTheDocument();
  });

  it('puts the lazily loaded notice into the outlet context for a reported count', async () => {
    mount(2);

    expect(screen.getByText('banner given:true')).toBeInTheDocument();
    expect(await screen.findByText('notice for 2')).toBeInTheDocument();
  });

  it('puts the notice in for zero remaining codes too', async () => {
    mount(0);

    expect(await screen.findByText('notice for 0')).toBeInTheDocument();
  });
});
