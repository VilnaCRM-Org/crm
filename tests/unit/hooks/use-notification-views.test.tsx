import { renderHook } from '@testing-library/react';
import type { i18n as I18nType } from 'i18next';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useNotificationViews from '@/hooks/use-notification-views';
import type { ShownNotificationSet } from '@/lib/notifications/types/shown-notification';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const RAISED_AT = 1_790_000_000_000;

const wrapperFor = (instance: I18nType): ((props: { children: ReactNode }) => JSX.Element) => {
  function I18nWrapper({ children }: { children: ReactNode }): JSX.Element {
    return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
  }

  return I18nWrapper;
};

const seedInstance = (): I18nType =>
  createLocaleI18n('uk', ['en'], {
    message: 'Повідомлення',
    retry: 'Повторити',
    time: 'о {{value}}',
  });

const shownSet = (onActivate: () => void = jest.fn()): ShownNotificationSet => ({
  items: [
    { kind: 'success', messageKey: 'message', id: 41, batch: 3, raisedAt: RAISED_AT },
    {
      kind: 'error',
      messageKey: 'message',
      action: { labelKey: 'retry', onActivate },
      id: 42,
      batch: 3,
      raisedAt: RAISED_AT,
    },
  ],
});

describe('useNotificationViews', () => {
  it('maps each shown item to a view with a string id and translated texts', () => {
    const onActivate = jest.fn();
    const set = shownSet(onActivate);
    const { result } = renderHook(() => useNotificationViews(set), {
      wrapper: wrapperFor(seedInstance()),
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toEqual({
      id: '41',
      kind: 'success',
      message: 'Повідомлення',
      action: undefined,
      time: undefined,
    });
    expect(result.current.items[1]).toEqual({
      id: '42',
      kind: 'error',
      message: 'Повідомлення',
      action: { label: 'Повторити', onActivate },
      time: undefined,
    });
  });

  it('exposes no message key to the renderers', () => {
    const { result } = renderHook(() => useNotificationViews(shownSet()), {
      wrapper: wrapperFor(seedInstance()),
    });

    result.current.items.forEach((view) => {
      expect(view).not.toHaveProperty('messageKey');
      expect(view).not.toHaveProperty('raisedAt');
      expect(view).not.toHaveProperty('batch');
    });
  });

  it('adds the formatted time only when a time key is passed', () => {
    const set = shownSet();
    const wrapper = wrapperFor(seedInstance());

    const { result: withTime } = renderHook(() => useNotificationViews(set, { timeKey: 'time' }), {
      wrapper,
    });
    const { result: withoutTime } = renderHook(() => useNotificationViews(set, {}), { wrapper });
    const { result: withoutOptions } = renderHook(() => useNotificationViews(set), { wrapper });

    expect(withTime.current.items.map((view) => view.time)).toEqual([
      `о ${RAISED_AT}`,
      `о ${RAISED_AT}`,
    ]);
    expect(withoutTime.current.items.map((view) => view.time)).toEqual([undefined, undefined]);
    expect(withoutOptions.current.items.map((view) => view.time)).toEqual([undefined, undefined]);
  });

  it('keeps the same result for the same set and key and recomputes when the set changes', () => {
    const wrapper = wrapperFor(seedInstance());
    const first = shownSet();
    const { result, rerender } = renderHook(
      ({ set }: { set: ShownNotificationSet }) => useNotificationViews(set, { timeKey: 'time' }),
      { wrapper, initialProps: { set: first } }
    );
    const initial = result.current;

    rerender({ set: first });
    expect(result.current).toBe(initial);

    rerender({ set: shownSet() });
    expect(result.current).not.toBe(initial);
  });

  it.each([
    ['uk', 'Зміни збережено'],
    ['en', 'Changes saved'],
  ] as const)('maps settings.toasts.saved to the shipped %s copy', (locale, expected) => {
    const set: ShownNotificationSet = {
      items: [
        {
          kind: 'success',
          messageKey: 'settings.toasts.saved',
          id: 1,
          batch: 1,
          raisedAt: RAISED_AT,
        },
      ],
    };
    const { result } = renderHook(() => useNotificationViews(set), {
      wrapper: wrapperFor(createSettingsLocaleI18n(locale)),
    });

    expect(result.current.items[0]?.message).toBe(expected);
  });
});
