import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import i18n from '@/i18n';
import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import type { NotificationClock } from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import type { NotificationRecordSet } from '@/modules/user/features/notifications';
import { NotificationRepositoryContext } from '@/modules/user/features/notifications/hooks/use-notification-repository';
import {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories/in-memory-notification-repository';

export const SEEDED_HISTORY: NotificationRecordSet = NOTIFICATION_SEED;

export const READ_HISTORY: NotificationRecordSet = {
  items: NOTIFICATION_SEED.items.map((record) => ({ ...record, read: true })),
};

const STORY_INSTANT = Date.parse('2026-11-11T10:30:00Z');

export const storyClock: NotificationClock = () => STORY_INSTANT;

export function withRaisedNotifications(
  drafts: NotificationDraftSet,
  clock: NotificationClock = () => Date.now()
): Decorator {
  return function RaisedNotificationsDecorator(Story): JSX.Element {
    useEffect(() => {
      const store = useNotificationOutletStore;
      store.setState(store.getInitialState(), true);
      const actions = new NotificationOutletActions(store, clock);
      actions.raise(drafts, (key) => i18n.t(key));

      return (): void => store.setState(store.getInitialState(), true);
    }, []);
    return <Story />;
  };
}

export function withFreshNotificationRepository(seed?: NotificationRecordSet): Decorator {
  return function FreshNotificationRepositoryDecorator(Story): JSX.Element {
    const [repository] = useState(
      () => new InMemoryNotificationRepository(seed ?? NOTIFICATION_SEED)
    );
    return (
      <NotificationRepositoryContext.Provider value={repository}>
        <Story />
      </NotificationRepositoryContext.Provider>
    );
  };
}
