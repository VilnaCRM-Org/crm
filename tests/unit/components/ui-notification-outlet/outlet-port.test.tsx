import { render } from '@testing-library/react';
import { createRef, type JSX } from 'react';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import type { NotificationsPort } from '@/hooks/types/notifications-port';
import useNotifications from '@/hooks/use-notifications';

jest.mock('@/hooks/use-notifications', () => ({ __esModule: true, default: jest.fn() }));

const usePort = jest.mocked(useNotifications);

const buildPort = (): jest.Mocked<NotificationsPort> => ({
  raise: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  publishFocus: jest.fn(),
  clear: jest.fn(),
});

const target = createRef<HTMLElement>();

const outlet = (): JSX.Element => <UINotificationOutlet returnFocusRef={target} />;

describe('UINotificationOutlet against its port', () => {
  it('publishes to, and clears, the port it was last given', () => {
    const [first, second] = [buildPort(), buildPort()];
    usePort.mockReturnValue(first);
    const { rerender, unmount } = render(outlet());
    rerender(outlet());
    expect(first.publishFocus).toHaveBeenCalledTimes(1);
    expect(first.clear).not.toHaveBeenCalled();

    usePort.mockReturnValue(second);
    rerender(outlet());
    expect(first.clear).toHaveBeenCalledTimes(1);
    expect(second.publishFocus).toHaveBeenCalledWith({ primary: target, fallback: undefined });

    unmount();
    expect(first.clear).toHaveBeenCalledTimes(1);
    expect(second.clear).toHaveBeenCalledTimes(1);
  });
});
