import { render, type RenderResult } from '@testing-library/react';
import type { JSX, ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import createAppShellLocaleI18n from './create-app-shell-locale-i18n';

type ShellLocale = Parameters<typeof createAppShellLocaleI18n>[0];

interface ShellRenderOptions {
  readonly locale?: ShellLocale | undefined;
  readonly path?: string | undefined;
}

const renderShell = (
  ui: ReactElement,
  { locale = 'en', path = '/' }: ShellRenderOptions = {}
): RenderResult => {
  const i18n = createAppShellLocaleI18n(locale, ['en', 'uk']);
  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </I18nextProvider>
  );

  return render(ui, { wrapper: Wrapper });
};

export default renderShell;
