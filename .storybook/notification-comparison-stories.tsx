import Box from '@mui/material/Box';
import type { Decorator, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import UIAppHeader from '@/components/ui-app-header';
import type { NotificationStyle } from '@/config/runtime/types/notification-style';
import i18n from '@/i18n';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import NotificationsShellSlot from '@/modules/user/features/notifications/components/notifications-shell-slot';

import { storyItems } from './navigation-story-items';
import NotificationComparisonFrame, { COMPARISON_ANCHOR } from './notification-comparison-frame';
import {
  FIXED_CLOCK,
  withFreshNotificationRepository,
  withNotificationStyle,
  withRaisedNotifications,
} from './notification-story-decorators';
import { noop } from './story-callbacks';
import waitForText from './wait-for-text';

export type ComparisonStory = StoryObj<typeof ComparisonStage>;

export type ComparisonViewport = 'xl' | 'lg1366' | 'mobile375';

export interface ComparisonStageArgs {
  readonly layout: ShellLayout;
}

interface ComparisonPlayContext {
  readonly canvasElement: HTMLElement;
}

const LAYOUTS: Record<ComparisonViewport, ShellLayout> = {
  xl: 'desktop',
  lg1366: 'tablet',
  mobile375: 'mobile',
};

const anchored = { anchor: COMPARISON_ANCHOR } as const;

const retry = { labelKey: 'auth.error.tryAgain', onActivate: noop };

export const ONE_SUCCESS: NotificationDraftSet = {
  items: [{ kind: 'success', messageKey: 'settings.toasts.saved', ...anchored }],
};

export const THREE_SUCCESSES: NotificationDraftSet = {
  items: [
    { kind: 'success', messageKey: 'settings.toasts.saved', ...anchored },
    { kind: 'success', messageKey: 'settings.toasts.email_sent', ...anchored },
    { kind: 'success', messageKey: 'settings.toasts.password_changed', ...anchored },
  ],
};

export const TRANSIENT_ERROR: NotificationDraftSet = {
  items: [
    {
      kind: 'error',
      messageKey: 'settings.toasts.save_failed_transient',
      action: retry,
      ...anchored,
    },
  ],
};

export const PERMANENT_ERROR: NotificationDraftSet = {
  items: [{ kind: 'error', messageKey: 'settings.toasts.save_failed', ...anchored }],
};

const PAGE = { minHeight: '40rem', backgroundColor: '#FBFBFB' } as const;

const NO_ANIMATION = { '& *': { animation: 'none !important' } } as const;

const REDUCED_MOTION_NOTE =
  'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes every ' +
  'animation in its frame. The real media path is pinned by the unit style tests and by ' +
  'Playwright `emulateMedia`.';

export function ComparisonStage({ layout }: ComparisonStageArgs): JSX.Element {
  return (
    <Box sx={PAGE}>
      <UIAppHeader
        layout={layout}
        navigation={{ items: storyItems, signOut: noop }}
        notifications={
          <NotificationsShellSlot
            layout={layout}
            signOut={noop}
            onAvatar={noop}
            onChunkFailure={noop}
          />
        }
      />
      <NotificationComparisonFrame layout={layout} />
    </Box>
  );
}

const withoutAnimation: Decorator = function WithoutAnimationDecorator(Story): JSX.Element {
  return (
    <Box sx={NO_ANIMATION}>
      <Story />
    </Box>
  );
};

const openBell = ({ canvasElement }: ComparisonPlayContext): Promise<void> => {
  canvasElement.querySelector<HTMLButtonElement>('button[aria-expanded]')?.click();

  return Promise.resolve();
};

export const markAllRead = async ({ canvasElement }: ComparisonPlayContext): Promise<void> => {
  const label = i18n.t('notification_center.history.mark_all_read');
  await openBell({ canvasElement });
  await waitForText(canvasElement, label);
  [...canvasElement.querySelectorAll<HTMLButtonElement>('button')]
    .find((button) => button.textContent === label)
    ?.click();
};

export function comparisonStory(
  style: NotificationStyle,
  drafts: NotificationDraftSet,
  viewport: ComparisonViewport
): ComparisonStory {
  return {
    args: { layout: LAYOUTS[viewport] },
    globals: { viewport: { value: viewport, isRotated: false } },
    decorators: [
      withRaisedNotifications(drafts, FIXED_CLOCK),
      withFreshNotificationRepository(),
      withNotificationStyle(style),
    ],
  };
}

export function reducedMotion(style: NotificationStyle): ComparisonStory {
  return {
    ...comparisonStory(style, THREE_SUCCESSES, 'xl'),
    decorators: [
      withoutAnimation,
      withRaisedNotifications(THREE_SUCCESSES, FIXED_CLOCK),
      withFreshNotificationRepository(),
      withNotificationStyle(style),
    ],
    parameters: { docs: { description: { story: REDUCED_MOTION_NOTE } } },
  };
}

export function historyOpen(style: NotificationStyle): ComparisonStory {
  return { ...comparisonStory(style, THREE_SUCCESSES, 'xl'), play: openBell };
}
