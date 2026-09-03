import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';

type MockI18n = {
  language: string;
  dir?: (language: string) => 'ltr' | 'rtl';
  on?: jest.Mock;
  off?: jest.Mock;
};

let mockI18n: MockI18n = { language: 'en' };

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n } => ({ i18n: mockI18n }),
}));

const useRootLayoutDir = jest.requireActual<
  typeof import('@/components/layouts/use-root-layout-dir')
>('@/components/layouts/use-root-layout-dir').default;

function buildI18n(language: string, direction: 'ltr' | 'rtl'): MockI18n {
  return {
    language,
    dir: (): 'ltr' | 'rtl' => direction,
    on: jest.fn(),
    off: jest.fn(),
  };
}

describe('useRootLayoutDir instance changes', () => {
  beforeEach(() => {
    document.documentElement.dir = '';
    mockI18n = buildI18n('en', 'ltr');
  });

  it('re-applies the direction and moves the listener when the i18n instance is swapped', () => {
    const first = mockI18n;
    const { rerender } = renderHook(() => useRootLayoutDir());

    expect(document.documentElement.dir).toBe('ltr');
    expect(first.on).toHaveBeenCalledWith('languageChanged', expect.any(Function));

    const second = buildI18n('ar', 'rtl');
    mockI18n = second;
    rerender();

    expect(document.documentElement.dir).toBe('rtl');
    expect(first.off).toHaveBeenCalledWith('languageChanged', expect.any(Function));
    expect(second.on).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });

  it('does not re-subscribe while the same i18n instance is kept', () => {
    const only = mockI18n;
    const { rerender } = renderHook(() => useRootLayoutDir());

    rerender();

    expect(only.on).toHaveBeenCalledTimes(1);
    expect(only.off).not.toHaveBeenCalled();
    expect(document.documentElement.dir).toBe('ltr');
  });
});
