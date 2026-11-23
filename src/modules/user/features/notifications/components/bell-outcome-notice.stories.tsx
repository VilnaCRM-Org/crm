import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useRef } from 'react';

import useBellAnchor from '@/components/ui-bell-notice/use-bell-anchor';
import UINotificationOutlet from '@/components/ui-notification-outlet';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import Notice from '@/modules/user/features/notifications/components/bell-outcome-notice';
import {
  withNotificationStyle,
  withRaisedNotifications,
} from '@stories/notification-story-decorators';
import { noop } from '@stories/story-callbacks';

const saved = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

const ONE: NotificationDraftSet = { items: [saved] };

const THREE: NotificationDraftSet = {
  items: [
    saved,
    { kind: 'success', messageKey: 'settings.toasts.email_sent' },
    { kind: 'success', messageKey: 'settings.toasts.password_changed' },
  ],
};

const TRANSIENT: NotificationDraftSet = {
  items: [
    {
      kind: 'error',
      messageKey: 'settings.toasts.save_failed_transient',
      action: { labelKey: 'notifications.error.retry_button', onActivate: noop },
    },
  ],
};

const STAGE = {
  page: { minHeight: '20rem', backgroundColor: '#FBFBFB' },
  header: { position: 'sticky', top: 0, height: '64px', display: 'flex', alignItems: 'center' },
  wrapper: { position: 'relative', marginLeft: 'auto', marginRight: '3rem' },
  bell: {
    position: 'relative',
    zIndex: 1,
    width: '48px',
    height: '48px',
    border: 0,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
  },
  main: { padding: '1rem' },
  heading: { font: 'inherit' },
} as const;

function StageHeader(): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  useBellAnchor(bell);

  return (
    <Box component="header" sx={STAGE.header}>
      <Box sx={STAGE.wrapper}>
        <Box component="button" type="button" ref={bell} aria-label="Сповіщення" sx={STAGE.bell} />
        <Notice bellRef={bell} />
      </Box>
    </Box>
  );
}

function StageMain(): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <Box component="main" sx={STAGE.main}>
      <Box component="h1" ref={heading} tabIndex={-1} sx={STAGE.heading}>
        Налаштування
      </Box>
      <Box component="button" type="button" ref={save}>
        Зберегти
      </Box>
      <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
    </Box>
  );
}

function NoticeStage(): JSX.Element {
  return (
    <Box sx={STAGE.page}>
      <StageHeader />
      <StageMain />
    </Box>
  );
}

const meta: Meta<typeof NoticeStage> = {
  title: 'Modules/User/Notifications/BellOutcomeNotice',
  component: NoticeStage,
  tags: ['autodocs'],
  globals: { viewport: { value: 'xl', isRotated: false } },
  decorators: [withNotificationStyle('bell')],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The outcomes of the `bell` style: the shown rows as the merged card on desktop and ' +
          'the caret card on tablet and mobile, each with its time and a close button. Closing ' +
          'a row only removes it from the page and never marks it read. Retry dismisses the ' +
          'row through the port before the action runs and returns focus to Save. It loads as ' +
          'its own chunk, `notifications-notice`, only under `bell`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NoticeStage>;

export const DesktopOneRow: Story = { decorators: [withRaisedNotifications(ONE)] };

export const DesktopThreeRows: Story = { decorators: [withRaisedNotifications(THREE)] };

export const TabletCaret: Story = {
  decorators: [withRaisedNotifications(THREE)],
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const MobileCaret: Story = {
  decorators: [withRaisedNotifications(THREE)],
  globals: { viewport: { value: 'xs', isRotated: false } },
};

export const TransientError: Story = { decorators: [withRaisedNotifications(TRANSIENT)] };
