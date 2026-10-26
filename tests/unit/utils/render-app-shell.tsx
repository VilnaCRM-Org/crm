import { render, type RenderResult, screen } from '@testing-library/react';
import type { JSX, ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import comingSoonEn from '@/components/coming-soon/i18n/en.json';
import comingSoonUk from '@/components/coming-soon/i18n/uk.json';
import AppLayout from '@/components/layouts/app-layout';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import UserMenuSlot from '@/modules/user/features/settings/components/user-menu/user-menu-slot';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import createAppShellLocaleI18n from './create-app-shell-locale-i18n';
import stubViewportWidth from './stub-viewport-width';

interface AppShellRenderOptions {
  readonly path: string;
  readonly width: number;
  readonly page: ReactElement;
  readonly signOut?: (() => void) | undefined;
}

const ignoreChunkFailure = (): undefined => undefined;

function BoundUserMenu({ signOut }: ProtectedOutletContext): JSX.Element {
  return <UserMenuSlot signOut={signOut} onChunkFailure={ignoreChunkFailure} />;
}

const renderAppShell = async ({
  path,
  width,
  page,
  signOut = jest.fn(),
}: AppShellRenderOptions): Promise<RenderResult> => {
  stubViewportWidth(width);
  const i18n = createAppShellLocaleI18n('uk', ['en', 'uk']);
  lazyCatalogLoader.register(i18n, { en: comingSoonEn, uk: comingSoonUk });
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={{ signOut }} />}>
            <Route element={<AppLayout userMenu={BoundUserMenu} />}>
              <Route path="*" element={page} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

  await screen.findByRole('banner');
  await screen.findByRole('contentinfo');

  return view;
};

export default renderAppShell;
