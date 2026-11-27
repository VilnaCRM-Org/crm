import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';

import useNotificationAnnouncement from '@/hooks/use-notification-announcement';
import useNotificationFocus from '@/hooks/use-notification-focus';
import useShownNotifications from '@/hooks/use-shown-notifications';
import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import { buildNotificationDraftSet } from '@tests/builders/notification-draft';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const actions = new NotificationOutletActions(useNotificationOutletStore, () => 5);
const identity = (key: string): string => key;

describe('notification reader hooks', () => {
  beforeEach(() => resetClientStores());

  it('useShownNotifications returns the stored shown set and keeps it on unrelated changes', () => {
    const { result } = renderHook(() => useShownNotifications());
    const initial = result.current;
    expect(initial).toBe(useNotificationOutletStore.getState().shown);

    act(() => useNotificationOutletStore.setState({ revision: 9 }));
    expect(result.current).toBe(initial);

    act(() => actions.raise(buildNotificationDraftSet(2), identity));
    expect(result.current).not.toBe(initial);
    expect(result.current.items).toHaveLength(2);
  });

  it('useNotificationAnnouncement returns the stored announcement, stable on other changes', () => {
    const { result } = renderHook(() => useNotificationAnnouncement());
    const initial = result.current;
    expect(initial).toEqual({ polite: '', assertive: '' });

    act(() => useNotificationOutletStore.setState({ revision: 9 }));
    expect(result.current).toBe(initial);

    act(() => actions.raise({ items: [{ kind: 'error', messageKey: 'boom' }] }, identity));
    expect(result.current).toBe(useNotificationOutletStore.getState().announcement);
    expect(result.current.assertive).toContain('boom');
  });

  it('useNotificationFocus returns the published focus and keeps it on unrelated changes', () => {
    const { result } = renderHook(() => useNotificationFocus());
    expect(result.current).toBeNull();
    const published = { primary: createRef<HTMLElement>() };

    act(() => actions.publishFocus(published));
    const afterPublish = result.current;
    expect(afterPublish).toBe(published);

    act(() => useNotificationOutletStore.setState({ revision: 9 }));
    expect(result.current).toBe(afterPublish);

    act(() => actions.clear());
    expect(result.current).toBeNull();
  });
});
