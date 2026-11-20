import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useSlotViews from '@/components/ui-notification-slot/use-slot-views';
import useNotifications from '@/hooks/use-notifications';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const i18n = createSettingsLocaleI18n('en');

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const saved = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

describe('useSlotViews', () => {
  beforeEach(() => resetClientStores());

  it('returns no views before anything is raised', () => {
    const { result } = renderHook(() => useSlotViews('primary'), { wrapper });

    expect(result.current.items).toEqual([]);
  });

  it('returns the translated lines of the anchor batch, unwrapped without an action', () => {
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { result } = renderHook(() => useSlotViews('primary'), { wrapper });

    act(() => port.raise({ items: [saved] }));

    expect(result.current.items).toEqual([
      { id: '1', kind: 'success', message: 'Changes saved', action: undefined, time: undefined },
    ]);
  });

  it('wraps an action so it focuses, withdraws the batch and then runs the original', () => {
    const order: string[] = [];
    const target = document.createElement('button');
    document.body.appendChild(target);
    target.addEventListener('focus', () => order.push('focus'));
    useNotificationOutletStore.setState({ focus: { primary: { current: target } } });
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { result } = renderHook(() => useSlotViews('primary'), { wrapper });
    act(() =>
      port.raise({
        items: [
          {
            ...saved,
            action: {
              labelKey: 'notifications.error.retry_button',
              onActivate: (): void => {
                order.push('run');
              },
            },
          },
        ],
      })
    );
    const action = result.current.items[0]?.action;

    act(() => action?.onActivate());

    expect(action?.label).toBe('Try again');
    expect(order).toEqual(['focus', 'run']);
    expect(result.current.items).toEqual([]);
    target.remove();
  });

  it('keeps the same set across rerenders while nothing changes', () => {
    const { result, rerender } = renderHook(() => useSlotViews('primary'), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
