import Box from '@mui/material/Box';
import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import UIAppHeader from '@/components/ui-app-header';
import type { NotificationStyle } from '@/config/runtime/types/notification-style';
import i18n from '@/i18n';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import { storyItems } from '@stories/navigation-story-items';
import NotificationComparisonFrame, {
  COMPARISON_ANCHOR,
} from '@stories/notification-comparison-frame';
import {
  FIXED_CLOCK,
  withFreshNotificationRepository,
  withNotificationStyle,
  withRaisedNotifications,
} from '@stories/notification-story-decorators';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';
import waitForText from '@stories/wait-for-text';

import NotificationsShellSlot from '../notifications-shell-slot';

type ComparisonViewport = 'xl' | 'lg1366' | 'mobile375';

interface ComparisonStageArgs {
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

const ONE_SUCCESS: NotificationDraftSet = {
  items: [{ kind: 'success', messageKey: 'settings.toasts.saved', ...anchored }],
};

const THREE_SUCCESSES: NotificationDraftSet = {
  items: [
    { kind: 'success', messageKey: 'settings.toasts.saved', ...anchored },
    { kind: 'success', messageKey: 'settings.toasts.email_sent', ...anchored },
    { kind: 'success', messageKey: 'settings.toasts.password_changed', ...anchored },
  ],
};

const TRANSIENT_ERROR: NotificationDraftSet = {
  items: [
    {
      kind: 'error',
      messageKey: 'settings.toasts.save_failed_transient',
      action: retry,
      ...anchored,
    },
  ],
};

const PERMANENT_ERROR: NotificationDraftSet = {
  items: [{ kind: 'error', messageKey: 'settings.toasts.save_failed', ...anchored }],
};

const PAGE = { minHeight: '40rem', backgroundColor: '#FBFBFB' } as const;

const NO_ANIMATION = { '& *': { animation: 'none !important' } } as const;

const REDUCED_MOTION_NOTE =
  'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes every ' +
  'animation in its frame. The real media path is pinned by the unit style tests and by ' +
  'Playwright `emulateMedia`.';

function ComparisonStage({ layout }: ComparisonStageArgs): JSX.Element {
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

const markAllRead = async ({ canvasElement }: ComparisonPlayContext): Promise<void> => {
  const label = i18n.t('notification_center.history.mark_all_read');
  await openBell({ canvasElement });
  await waitForText(canvasElement, label);
  [...canvasElement.querySelectorAll<HTMLButtonElement>('button')]
    .find((button) => button.textContent === label)
    ?.click();
};

const meta: Meta<typeof ComparisonStage> = {
  title: 'Notifications/Comparison',
  component: ComparisonStage,
  args: { layout: 'desktop' },
  decorators: [withMemoryRouter('/settings')],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The three notification styles side by side: `toast`, `inline` and `bell`, each ' +
          'with one success, three successes, a transient error and a permanent error, at ' +
          '1440, 1366 and 375 px. Every outcome is raised through the notifications port ' +
          'with a frozen clock and the shipped settings copy, and every story records into ' +
          'its own fresh in-memory history, so the badge starts from the seed in each one. ' +
          'The shell layout arrives as an arg, so the header matches the viewport in every ' +
          'frame.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ComparisonStage>;

function comparison(
  style: NotificationStyle,
  drafts: NotificationDraftSet,
  viewport: ComparisonViewport
): Story {
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

function reducedMotion(style: NotificationStyle): Story {
  return {
    ...comparison(style, THREE_SUCCESSES, 'xl'),
    decorators: [
      withoutAnimation,
      withRaisedNotifications(THREE_SUCCESSES, FIXED_CLOCK),
      withFreshNotificationRepository(),
      withNotificationStyle(style),
    ],
    parameters: { docs: { description: { story: REDUCED_MOTION_NOTE } } },
  };
}

function historyOpen(style: NotificationStyle): Story {
  return { ...comparison(style, THREE_SUCCESSES, 'xl'), play: openBell };
}

export const ToastOneSuccessXl: Story = comparison('toast', ONE_SUCCESS, 'xl');
export const ToastOneSuccessLg1366: Story = comparison('toast', ONE_SUCCESS, 'lg1366');
export const ToastOneSuccessMobile375: Story = comparison('toast', ONE_SUCCESS, 'mobile375');
export const ToastThreeSuccessesXl: Story = comparison('toast', THREE_SUCCESSES, 'xl');
export const ToastThreeSuccessesLg1366: Story = comparison('toast', THREE_SUCCESSES, 'lg1366');
export const ToastThreeSuccessesMobile375: Story = comparison(
  'toast',
  THREE_SUCCESSES,
  'mobile375'
);
export const ToastTransientErrorXl: Story = comparison('toast', TRANSIENT_ERROR, 'xl');
export const ToastTransientErrorLg1366: Story = comparison('toast', TRANSIENT_ERROR, 'lg1366');
export const ToastTransientErrorMobile375: Story = comparison(
  'toast',
  TRANSIENT_ERROR,
  'mobile375'
);
export const ToastPermanentErrorXl: Story = comparison('toast', PERMANENT_ERROR, 'xl');
export const ToastPermanentErrorLg1366: Story = comparison('toast', PERMANENT_ERROR, 'lg1366');
export const ToastPermanentErrorMobile375: Story = comparison(
  'toast',
  PERMANENT_ERROR,
  'mobile375'
);

export const InlineOneSuccessXl: Story = comparison('inline', ONE_SUCCESS, 'xl');
export const InlineOneSuccessLg1366: Story = comparison('inline', ONE_SUCCESS, 'lg1366');
export const InlineOneSuccessMobile375: Story = comparison('inline', ONE_SUCCESS, 'mobile375');
export const InlineThreeSuccessesXl: Story = comparison('inline', THREE_SUCCESSES, 'xl');
export const InlineThreeSuccessesLg1366: Story = comparison('inline', THREE_SUCCESSES, 'lg1366');
export const InlineThreeSuccessesMobile375: Story = comparison(
  'inline',
  THREE_SUCCESSES,
  'mobile375'
);
export const InlineTransientErrorXl: Story = comparison('inline', TRANSIENT_ERROR, 'xl');
export const InlineTransientErrorLg1366: Story = comparison('inline', TRANSIENT_ERROR, 'lg1366');
export const InlineTransientErrorMobile375: Story = comparison(
  'inline',
  TRANSIENT_ERROR,
  'mobile375'
);
export const InlinePermanentErrorXl: Story = comparison('inline', PERMANENT_ERROR, 'xl');
export const InlinePermanentErrorLg1366: Story = comparison('inline', PERMANENT_ERROR, 'lg1366');
export const InlinePermanentErrorMobile375: Story = comparison(
  'inline',
  PERMANENT_ERROR,
  'mobile375'
);

export const BellOneSuccessXl: Story = comparison('bell', ONE_SUCCESS, 'xl');
export const BellOneSuccessLg1366: Story = comparison('bell', ONE_SUCCESS, 'lg1366');
export const BellOneSuccessMobile375: Story = comparison('bell', ONE_SUCCESS, 'mobile375');
export const BellThreeSuccessesXl: Story = comparison('bell', THREE_SUCCESSES, 'xl');
export const BellThreeSuccessesLg1366: Story = comparison('bell', THREE_SUCCESSES, 'lg1366');
export const BellThreeSuccessesMobile375: Story = comparison('bell', THREE_SUCCESSES, 'mobile375');
export const BellTransientErrorXl: Story = comparison('bell', TRANSIENT_ERROR, 'xl');
export const BellTransientErrorLg1366: Story = comparison('bell', TRANSIENT_ERROR, 'lg1366');
export const BellTransientErrorMobile375: Story = comparison('bell', TRANSIENT_ERROR, 'mobile375');
export const BellPermanentErrorXl: Story = comparison('bell', PERMANENT_ERROR, 'xl');
export const BellPermanentErrorLg1366: Story = comparison('bell', PERMANENT_ERROR, 'lg1366');
export const BellPermanentErrorMobile375: Story = comparison('bell', PERMANENT_ERROR, 'mobile375');

export const ToastReducedMotion: Story = reducedMotion('toast');
export const InlineReducedMotion: Story = reducedMotion('inline');
export const BellReducedMotion: Story = reducedMotion('bell');

export const ToastHistoryOpen: Story = historyOpen('toast');
export const InlineHistoryOpen: Story = historyOpen('inline');
export const BellHistoryOpen: Story = historyOpen('bell');

export const BellAfterMarkAllRead: Story = {
  ...comparison('bell', THREE_SUCCESSES, 'xl'),
  play: markAllRead,
};
