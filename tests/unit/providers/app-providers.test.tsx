// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { useTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';

import AppProviders from '@/providers/app-providers';

function ThemeChecker(): JSX.Element {
  const theme = useTheme();
  return <span>{theme.palette ? 'has-theme' : 'no-theme'}</span>;
}

function I18nChecker(): JSX.Element {
  const { i18n } = useTranslation();
  return <span>{i18n.isInitialized ? 'i18n-ready' : 'i18n-not-ready'}</span>;
}

describe('AppProviders', () => {
  it('renders children (AC1)', () => {
    render(
      <AppProviders>
        <span>child</span>
      </AppProviders>
    );

    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('provides MUI theme to children via context (AC1)', () => {
    render(
      <AppProviders>
        <ThemeChecker />
      </AppProviders>
    );

    expect(screen.getByText('has-theme')).toBeInTheDocument();
  });

  it('provides i18n instance to children via context (AC1)', () => {
    render(
      <AppProviders>
        <I18nChecker />
      </AppProviders>
    );

    expect(screen.getByText('i18n-ready')).toBeInTheDocument();
  });
});
