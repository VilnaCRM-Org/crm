// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

type MockI18n = {
  language: string;
  dir?: (language: string) => 'ltr' | 'rtl';
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
};

let mockI18n: MockI18n = { language: 'en' };

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n } => ({ i18n: mockI18n }),
}));

jest.mock('react-router-dom', () => ({
  Outlet: (): ReactElement => <span>route-outlet</span>,
}));

const RootLayout = jest.requireActual<typeof import('@/components/layouts/root-layout')>(
  '@/components/layouts/root-layout'
).default;

describe('RootLayout', () => {
  beforeEach(() => {
    mockI18n = { language: 'en' };
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  it('renders Outlet inside Suspense (AC3)', () => {
    render(<RootLayout />);

    expect(screen.getByText('route-outlet')).toBeInTheDocument();
  });

  it('sets document.dir from i18n.dir on mount (AC1)', async () => {
    mockI18n = { language: 'ar', dir: (): 'rtl' => 'rtl' };

    render(<RootLayout />);

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
  });

  it('falls back to ltr when i18n.dir is unavailable (AC1)', async () => {
    mockI18n = { language: 'en' };

    render(<RootLayout />);

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
  });

  it('re-applies dir on languageChanged event (AC1)', async () => {
    let handler: (() => void) | undefined;
    mockI18n = {
      language: 'en',
      dir: (lang: string): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr'),
      on: (event: string, cb: () => void): void => {
        if (event === 'languageChanged') handler = cb;
      },
      off: jest.fn(),
    };

    render(<RootLayout />);

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
    mockI18n.language = 'ar';
    handler?.();

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
  });

  it('removes languageChanged listener on unmount (AC1)', () => {
    const off = jest.fn();
    mockI18n = {
      language: 'en',
      on: jest.fn(),
      off,
    };

    const view = render(<RootLayout />);
    view.unmount();

    expect(off).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });

  it('does not set document.documentElement.lang (AC2)', async () => {
    mockI18n = { language: 'uk', dir: (): 'ltr' => 'ltr' };

    render(<RootLayout />);

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
    expect(document.documentElement.lang).toBe('');
  });
});
