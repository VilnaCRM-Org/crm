import { act, renderHook } from '@testing-library/react';
import type { i18n as I18nType } from 'i18next';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useNotifications from '@/hooks/use-notifications';
import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const FIXED_INSTANT = 1_790_000_000_000;

const wrapperFor = (instance: I18nType): ((props: { children: ReactNode }) => JSX.Element) => {
  function I18nWrapper({ children }: { children: ReactNode }): JSX.Element {
    return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
  }

  return I18nWrapper;
};

const savedDraft = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

describe('useNotifications', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => jest.useRealTimers());

  it('keeps every port function identical across renders', () => {
    const wrapper = wrapperFor(createSettingsLocaleI18n('en'));
    const { result, rerender } = renderHook(() => useNotifications(), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(result.current.raise).toBe(first.raise);
    expect(result.current.dismiss).toBe(first.dismiss);
    expect(result.current.dismissAll).toBe(first.dismissAll);
    expect(result.current.withdraw).toBe(first.withdraw);
    expect(result.current.publishFocus).toBe(first.publishFocus);
    expect(result.current.clear).toBe(first.clear);
  });

  it('translates the drafts with the active language at raise time', () => {
    const wrapper = wrapperFor(createSettingsLocaleI18n('uk', ['en']));
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => result.current.raise({ items: [savedDraft] }));

    expect(useNotificationOutletStore.getState().announcement).toEqual({
      polite: `Зміни збережено${ALTERNATING_MARK}`,
      assertive: '',
    });
  });

  it('follows a language change with a port that translates in the new language', async () => {
    const instance = createSettingsLocaleI18n('uk', ['en']);
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapperFor(instance) });

    await act(async () => {
      await instance.changeLanguage('en');
    });
    act(() => result.current.raise({ items: [savedDraft] }));

    expect(useNotificationOutletStore.getState().announcement.polite).toBe(
      `Changes saved${ALTERNATING_MARK}`
    );
  });

  it('stamps every shown item with the current instant', () => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_INSTANT);
    const wrapper = wrapperFor(createSettingsLocaleI18n('en'));
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => result.current.raise({ items: [savedDraft, savedDraft] }));

    const stamps = useNotificationOutletStore.getState().shown.items.map((item) => item.raisedAt);
    expect(stamps).toEqual([FIXED_INSTANT, FIXED_INSTANT]);
  });

  it('dismisses, dismisses all and withdraws through the same store', () => {
    const wrapper = wrapperFor(createSettingsLocaleI18n('en'));
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() =>
      result.current.raise({
        items: [savedDraft, savedDraft, { ...savedDraft, anchor: 'email' }],
      })
    );

    act(() => result.current.dismiss(1));
    expect(useNotificationOutletStore.getState().shown.items.map((item) => item.id)).toEqual([
      2, 3,
    ]);

    act(() => result.current.withdraw('email'));
    expect(useNotificationOutletStore.getState().inline.items).toEqual([
      { anchor: 'primary', batch: 1 },
    ]);

    act(() => result.current.dismissAll());
    expect(useNotificationOutletStore.getState().shown.items).toEqual([]);
  });

  it('publishes the focus return refs and clears the outlet through the same store', () => {
    const wrapper = wrapperFor(createSettingsLocaleI18n('en'));
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const focus = { primary: { current: null }, fallback: { current: null } };

    act(() => result.current.publishFocus(focus));
    expect(useNotificationOutletStore.getState().focus).toBe(focus);

    act(() => result.current.raise({ items: [savedDraft] }));
    act(() => result.current.clear());

    const state = useNotificationOutletStore.getState();
    expect(state.focus).toBeNull();
    expect(state.shown.items).toEqual([]);
    expect(state.inline.items).toEqual([]);
    expect(state.announcement).toEqual({ polite: '', assertive: '' });
  });
});
