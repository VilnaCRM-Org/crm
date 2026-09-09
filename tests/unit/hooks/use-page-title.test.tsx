import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import usePageTitle from '@/hooks/use-page-title';

/**
 * Deliberately separate from the auth module's suite, which reaches the same hook through the
 * `export { default } from '@/hooks/use-page-title'` re-export. Importing the implementation
 * directly is what puts its module-level values under an assertion: before this suite existed the
 * file carried ten mutants that no test ever executed. Merging the two suites would read as
 * de-duplication and silently give those kills back.
 */

type LanguageListener = () => void;

interface MockI18n {
  language: string;
  t: (key: string) => string;
  on?: jest.Mock;
  off?: jest.Mock;
}

const SIGN_UP_KEY = 'sign_up.title';
const SIGN_IN_KEY = 'sign_in.title';
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: { [SIGN_UP_KEY]: 'Registration', [SIGN_IN_KEY]: 'Authentication' },
  uk: { [SIGN_UP_KEY]: 'Реєстрація', [SIGN_IN_KEY]: 'Аутентифікація' },
};

let mockI18n: MockI18n;
let subscribedListener: LanguageListener | undefined;

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n } => ({ i18n: mockI18n }),
}));

function buildI18n(overrides: Partial<MockI18n> = {}): MockI18n {
  return {
    language: 'en',
    t: (key: string): string => TRANSLATIONS[mockI18n.language]?.[key] ?? key,
    on: jest.fn((event: string, listener: LanguageListener) => {
      if (event === 'languageChanged') subscribedListener = listener;
    }),
    off: jest.fn(),
    ...overrides,
  };
}

function TitleProbe({ titleKey }: { titleKey: string }): null {
  usePageTitle(titleKey);

  return null;
}

beforeEach(() => {
  subscribedListener = undefined;
  document.title = 'untouched';
  mockI18n = buildI18n();
});

describe('usePageTitle', () => {
  it('writes the translated key followed by the VilnaCRM suffix into document.title', () => {
    render(<TitleProbe titleKey={SIGN_UP_KEY} />);

    expect(document.title).toBe('Registration - VilnaCRM');
  });

  it('translates a different key into a different document.title', () => {
    render(<TitleProbe titleKey={SIGN_IN_KEY} />);

    expect(document.title).toBe('Authentication - VilnaCRM');
  });

  it('subscribes exactly one listener to the languageChanged event', () => {
    render(<TitleProbe titleKey={SIGN_UP_KEY} />);

    expect(mockI18n.on).toHaveBeenCalledTimes(1);
    expect(mockI18n.on).toHaveBeenCalledWith('languageChanged', expect.any(Function));
    expect(subscribedListener).toBeInstanceOf(Function);
  });

  it('re-applies the title when the subscribed listener fires after a language switch', () => {
    render(<TitleProbe titleKey={SIGN_UP_KEY} />);
    expect(document.title).toBe('Registration - VilnaCRM');

    mockI18n.language = 'uk';
    subscribedListener?.();

    expect(document.title).toBe('Реєстрація - VilnaCRM');
  });

  it('unsubscribes the very listener it subscribed, from the same event, on unmount', () => {
    const view = render(<TitleProbe titleKey={SIGN_UP_KEY} />);
    const listener = subscribedListener;
    expect(mockI18n.off).not.toHaveBeenCalled();

    view.unmount();

    expect(mockI18n.off).toHaveBeenCalledTimes(1);
    expect(mockI18n.off).toHaveBeenCalledWith('languageChanged', listener);
  });

  it('re-runs the effect when titleKey changes, resubscribing around the new title', () => {
    const view = render(<TitleProbe titleKey={SIGN_UP_KEY} />);
    expect(document.title).toBe('Registration - VilnaCRM');

    view.rerender(<TitleProbe titleKey={SIGN_IN_KEY} />);

    expect(document.title).toBe('Authentication - VilnaCRM');
    expect(mockI18n.off).toHaveBeenCalledTimes(1);
    expect(mockI18n.on).toHaveBeenCalledTimes(2);
  });

  it('still applies the title when the i18n instance exposes no subscribe method', () => {
    mockI18n = buildI18n({ on: undefined });

    expect(() => render(<TitleProbe titleKey={SIGN_IN_KEY} />)).not.toThrow();
    expect(document.title).toBe('Authentication - VilnaCRM');
  });

  it('unmounts cleanly when the i18n instance exposes no unsubscribe method', () => {
    mockI18n = buildI18n({ off: undefined });
    const view = render(<TitleProbe titleKey={SIGN_UP_KEY} />);
    expect(document.title).toBe('Registration - VilnaCRM');

    expect(() => view.unmount()).not.toThrow();
    // The cleanup restores the base title, so a page the user has left cannot keep naming the
    // document after itself.
    expect(document.title).toBe('VilnaCRM');
  });
});
