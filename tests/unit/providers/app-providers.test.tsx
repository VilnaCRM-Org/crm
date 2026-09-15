// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { useTheme } from '@mui/material/styles';
import { act, render, screen } from '@testing-library/react';
import React, { type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import AppProviders from '@/providers/app-providers';

const ROUTE_FALLBACK_DELAY_MS = 150;

const NeverResolves = React.lazy<() => JSX.Element>(() => new Promise(() => undefined));

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

  it('suspends a pending lazy child behind the deferred, announced route fallback', async () => {
    const previousLanguage = i18n.language;
    await i18n.changeLanguage('uk');
    jest.useFakeTimers();

    const view = render(
      <AppProviders>
        <NeverResolves />
      </AppProviders>
    );

    try {
      const status = screen.getByRole('status');
      expect(status).toBeEmptyDOMElement();

      act(() => {
        jest.advanceTimersByTime(ROUTE_FALLBACK_DELAY_MS);
      });

      expect(status).toHaveTextContent('Завантаження сторінки');
    } finally {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      view.unmount();
      jest.useRealTimers();
      await i18n.changeLanguage(previousLanguage);
    }
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
