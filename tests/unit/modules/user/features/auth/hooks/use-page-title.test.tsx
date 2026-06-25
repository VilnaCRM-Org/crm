// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import usePageTitle from '@/modules/user/features/auth/hooks/use-page-title';

type MockI18n = {
  language: string;
  t: (key: string) => string;
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
};

const TITLES: Record<string, Record<string, string>> = {
  en: { 'sign_up.title': 'Registration', 'sign_in.title': 'Authentication' },
  uk: { 'sign_up.title': 'Реєстрація', 'sign_in.title': 'Аутентифікація' },
};

let mockI18n: MockI18n;
let languageChangedHandler: (() => void) | undefined;

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n } => ({ i18n: mockI18n }),
}));

function TitleProbe({ titleKey }: { titleKey: string }): null {
  usePageTitle(titleKey);
  return null;
}

beforeEach(() => {
  languageChangedHandler = undefined;
  document.title = '';
  mockI18n = {
    language: 'en',
    t: (key: string): string => TITLES[mockI18n.language]?.[key] ?? key,
    on: jest.fn((event: string, callback: () => void) => {
      if (event === 'languageChanged') languageChangedHandler = callback;
    }),
    off: jest.fn(),
  };
});

describe('usePageTitle', () => {
  it('sets the localized document.title from sign_up.title (AC1)', () => {
    render(<TitleProbe titleKey="sign_up.title" />);

    expect(document.title).toBe('Registration - VilnaCRM');
  });

  it('sets a distinct localized document.title from sign_in.title (AC2)', () => {
    render(<TitleProbe titleKey="sign_in.title" />);

    expect(document.title).toBe('Authentication - VilnaCRM');
  });

  it('re-applies the title on languageChanged (AC3)', () => {
    render(<TitleProbe titleKey="sign_up.title" />);
    expect(document.title).toBe('Registration - VilnaCRM');

    mockI18n.language = 'uk';
    languageChangedHandler?.();

    expect(document.title).toBe('Реєстрація - VilnaCRM');
  });

  it('unsubscribes from languageChanged on unmount (AC4)', () => {
    const view = render(<TitleProbe titleKey="sign_up.title" />);

    view.unmount();

    expect(mockI18n.off).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });

  it('tolerates an i18n instance without on/off subscription methods', () => {
    mockI18n = {
      language: 'en',
      t: (key: string): string => TITLES.en[key] ?? key,
    };

    const view = render(<TitleProbe titleKey="sign_in.title" />);

    expect(document.title).toBe('Authentication - VilnaCRM');
    expect(() => view.unmount()).not.toThrow();
  });
});
