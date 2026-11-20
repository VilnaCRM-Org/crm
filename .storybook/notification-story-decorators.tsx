import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import type { NotificationStyle } from '@/config/runtime/types/notification-style';
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

interface ConfigBlockMemory {
  readonly element: HTMLScriptElement;
  readonly previous: string | null;
}

function writeStyleBlock(style: NotificationStyle): ConfigBlockMemory {
  const existing = document.getElementById(APP_CONFIG_ELEMENT_ID);
  const element =
    existing instanceof HTMLScriptElement ? existing : document.createElement('script');
  const previous = existing === null ? null : element.textContent;
  element.id = APP_CONFIG_ELEMENT_ID;
  element.type = 'application/json';
  element.textContent = JSON.stringify({ notificationStyle: style });
  if (existing === null) {
    document.head.appendChild(element);
  }
  return { element, previous };
}

function restoreStyleBlock({ element, previous }: ConfigBlockMemory): void {
  if (previous === null) {
    element.remove();
    return;
  }
  element.textContent = previous;
}

export function withNotificationStyle(style: NotificationStyle): Decorator {
  return function NotificationStyleDecorator(Story): JSX.Element {
    const [memory] = useState(() => writeStyleBlock(style));
    useEffect(() => (): void => restoreStyleBlock(memory), [memory]);
    return <Story />;
  };
}

const FIXED_EPOCH = Date.parse('2026-11-12T10:30:00Z');

export const FIXED_CLOCK: NotificationClock = () => FIXED_EPOCH;

const wallClock: NotificationClock = () => Date.now();

export function withRaisedNotifications(
  drafts: NotificationDraftSet,
  clock: NotificationClock = wallClock
): Decorator {
  return function RaisedNotificationsDecorator(Story): JSX.Element {
    useEffect(() => {
      const store = useNotificationOutletStore;
      store.setState(store.getInitialState(), true);
      new NotificationOutletActions(store, clock).raise(drafts, (key) => i18n.t(key));

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
