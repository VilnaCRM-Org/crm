import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useNotifications from '@/hooks/use-notifications';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useBellNoticeViews from '@/modules/user/features/notifications/hooks/use-bell-notice-views';
import createI18n from '@tests/unit/utils/create-notification-center-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const i18n = createI18n('en');

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const OPTIONS = { timeKey: 'notification_center.time' } as const;

const saved = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

describe('useBellNoticeViews', () => {
  beforeEach(() => resetClientStores());

  it('returns no views before anything is shown', () => {
    const { result } = renderHook(() => useBellNoticeViews(OPTIONS), { wrapper });

    expect(result.current.items).toEqual([]);
  });

  it('maps every shown item with its translated text and a time', () => {
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { result } = renderHook(() => useBellNoticeViews(OPTIONS), { wrapper });

    act(() => port.raise({ items: [saved] }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      id: '1',
      kind: 'success',
      message: 'Changes saved',
      action: undefined,
    });
    expect(result.current.items[0]?.time).toBe(
      i18n.t('notification_center.time', {
        value: useNotificationOutletStore.getState().shown.items[0]?.raisedAt,
      })
    );
    expect(result.current.items[0]?.time).toMatch(/\d/u);
  });

  it('wraps an action to focus, dismiss that row and then run the original', () => {
    const order: string[] = [];
    const target = document.createElement('button');
    document.body.appendChild(target);
    target.addEventListener('focus', () => order.push('focus'));
    useNotificationOutletStore.setState({ focus: { primary: { current: target } } });
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { result } = renderHook(() => useBellNoticeViews(OPTIONS), { wrapper });
    act(() =>
      port.raise({
        items: [
          {
            ...saved,
            action: {
              labelKey: 'notifications.error.retry_button',
              onActivate: (): void => {
                order.push(`run:${useNotificationOutletStore.getState().shown.items.length}`);
              },
            },
          },
        ],
      })
    );
    const action = result.current.items[0]?.action;

    act(() => action?.onActivate());

    expect(action?.label).toBe('Try again');
    expect(order).toEqual(['focus', 'run:0']);
    expect(result.current.items).toEqual([]);
    target.remove();
  });
});
