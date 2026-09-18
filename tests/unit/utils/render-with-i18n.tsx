import { ThemeProvider } from '@mui/material/styles';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { JSX, ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import testI18n from '@tests/i18n/test-i18n';

import { testTheme } from './render-with-providers';

function I18nWrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ThemeProvider theme={testTheme}>
      <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
    </ThemeProvider>
  );
}

/**
 * Renders under the test i18n instance and theme through RTL's `wrapper` option, so `rerender`
 * keeps the same provider tree (a bare `rerender` of a provider-wrapped element would remount
 * the whole subtree). Use it for shared components that call `useTranslation` themselves.
 */
const renderWithI18n = (
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult => render(ui, { ...options, wrapper: I18nWrapper });

export default renderWithI18n;
