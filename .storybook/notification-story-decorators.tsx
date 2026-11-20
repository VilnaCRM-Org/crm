import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import type { NotificationStyle } from '@/config/runtime/types/notification-style';
import i18n from '@/i18n';
import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';

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

export function withRaisedNotifications(drafts: NotificationDraftSet): Decorator {
  return function RaisedNotificationsDecorator(Story): JSX.Element {
    useEffect(() => {
      const store = useNotificationOutletStore;
      store.setState(store.getInitialState(), true);
      new NotificationOutletActions(store, () => Date.now()).raise(drafts, (key) => i18n.t(key));

      return (): void => store.setState(store.getInitialState(), true);
    }, []);
    return <Story />;
  };
}
