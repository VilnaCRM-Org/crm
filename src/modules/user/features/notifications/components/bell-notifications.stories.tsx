import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useRef } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import BellSlotFrame from '@/components/ui-app-header/bell-slot-frame';
import UINotificationOutlet from '@/components/ui-notification-outlet';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import BellNotifications from '@/modules/user/features/notifications/components/bell-notifications';
import {
  withFreshNotificationRepository,
  withRaisedNotifications,
} from '@stories/notification-story-decorators';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import useNotificationRecorder from '../hooks/use-notification-recorder';

const THREE: NotificationDraftSet = {
  items: [
    { kind: 'success', messageKey: 'settings.toasts.saved' },
    { kind: 'success', messageKey: 'settings.toasts.email_sent' },
    { kind: 'success', messageKey: 'settings.toasts.password_changed' },
  ],
};

const ALL_READ = {
  items: [
    {
      id: 'seed-1',
      kind: 'success',
      messageKey: 'notification_center.seed.password_changed',
      createdAt: Date.parse('2026-11-10T09:15:00Z'),
      read: true,
    },
    {
      id: 'seed-2',
      kind: 'success',
      messageKey: 'notification_center.seed.email_sent',
      createdAt: Date.parse('2026-11-09T16:40:00Z'),
      read: true,
    },
    {
      id: 'seed-3',
      kind: 'success',
      messageKey: 'notification_center.seed.saved',
      createdAt: Date.parse('2026-11-08T11:05:00Z'),
      read: true,
    },
  ],
} as const;

const STAGE = {
  page: { minHeight: '24rem', backgroundColor: '#FBFBFB' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '64px',
    paddingRight: '3rem',
    backgroundColor: '#FFFFFF',
  },
  main: { padding: '1rem' },
  heading: { font: 'inherit' },
} as const;

interface BellStageArgs {
  readonly layout: ShellLayout;
}

function BellStage({ layout }: BellStageArgs): JSX.Element {
  const revision = useNotificationRecorder(noop);
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <Box sx={STAGE.page}>
      <Box component="header" sx={STAGE.header}>
        <BellSlotFrame layout={layout}>
          <BellNotifications layout={layout} revision={revision} onChunkFailure={noop} />
        </BellSlotFrame>
      </Box>
      <Box component="main" sx={STAGE.main}>
        <Box component="h1" ref={heading} tabIndex={-1} sx={STAGE.heading}>
          Налаштування
        </Box>
        <Box component="button" type="button" ref={save}>
          Зберегти
        </Box>
        <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
      </Box>
    </Box>
  );
}

const openBell = ({ canvasElement }: { canvasElement: HTMLElement }): Promise<void> => {
  const bell = canvasElement.querySelector<HTMLButtonElement>('button[aria-expanded]');
  bell?.click();

  return Promise.resolve();
};

const meta: Meta<typeof BellStage> = {
  title: 'Modules/User/Notifications/BellNotifications',
  component: BellStage,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  decorators: [withMemoryRouter()],
  globals: { viewport: { value: 'xl', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The bell connector: the enabled bell with its unread badge and its single count ' +
          'description, the history panel host it opens and the merged outcome card beside ' +
          'it. The panel content loads as its own chunk on the first open and the card as its ' +
          'own chunk with the page; neither one can suspend the bell or the badge. Each story ' +
          'gets a fresh in-memory history, so marking rows read in one story never reaches ' +
          'another.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof BellStage>;

export const Closed: Story = { decorators: [withFreshNotificationRepository()] };

export const WithNotice: Story = {
  decorators: [withRaisedNotifications(THREE), withFreshNotificationRepository()],
};

export const HistoryOpen: Story = {
  decorators: [withFreshNotificationRepository()],
  play: openBell,
};

export const AfterMarkAllRead: Story = {
  decorators: [withFreshNotificationRepository(ALL_READ)],
  play: openBell,
};

export const MobileShell: Story = {
  decorators: [withFreshNotificationRepository()],
  args: { layout: 'mobile' },
  globals: { viewport: { value: 'xs', isRotated: false } },
};
