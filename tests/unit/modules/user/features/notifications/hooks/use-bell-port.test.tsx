import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import type { NotificationsPort } from '@/hooks/types/notifications-port';
import useNotifications from '@/hooks/use-notifications';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useBellDisclosure from '@/modules/user/features/notifications/hooks/use-bell-disclosure';
import useBellNoticeViews from '@/modules/user/features/notifications/hooks/use-bell-notice-views';
import createI18n from '@tests/unit/utils/create-notification-center-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

jest.mock('@/hooks/use-notifications', () => ({ __esModule: true, default: jest.fn() }));

const usePort = jest.mocked(useNotifications);

const i18n = createI18n('en');

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>
    <MemoryRouter>{children}</MemoryRouter>
  </I18nextProvider>
);

const portOf = (): jest.Mocked<NotificationsPort> => ({
  raise: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  publishFocus: jest.fn(),
  clear: jest.fn(),
});

const OPTIONS = { timeKey: 'notification_center.time' } as const;

const NO_BELL = { current: null };

describe('the bell hooks when the notifications port changes', () => {
  beforeEach(() => {
    resetClientStores();
    usePort.mockReset();
  });

  it('show hides the card through the latest port', () => {
    const first = portOf();
    const second = portOf();
    usePort.mockReturnValue(first);
    const { result, rerender } = renderHook(() => useBellDisclosure('desktop'), { wrapper });

    usePort.mockReturnValue(second);
    rerender();
    act(() => result.current.show());

    expect(first.dismissAll).not.toHaveBeenCalled();
    expect(second.dismissAll).toHaveBeenCalledTimes(1);
  });

  it('an action dismisses its row through the latest port', () => {
    const first = portOf();
    const second = portOf();
    const onActivate = jest.fn();
    useNotificationOutletStore.setState({
      shown: {
        items: [
          {
            id: 7,
            kind: 'error',
            messageKey: 'settings.toasts.saved',
            raisedAt: 0,
            action: { labelKey: 'notifications.error.retry_button', onActivate },
          },
        ],
      },
    });
    usePort.mockReturnValue(first);
    const { result, rerender } = renderHook(() => useBellNoticeViews(OPTIONS, NO_BELL), {
      wrapper,
    });

    usePort.mockReturnValue(second);
    rerender();
    act(() => result.current.items[0]?.action?.onActivate());

    expect(first.dismiss).not.toHaveBeenCalled();
    expect(second.dismiss).toHaveBeenCalledWith(7);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
