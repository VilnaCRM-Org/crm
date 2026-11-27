import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useRef } from 'react';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import Notice from '@/modules/user/features/notifications/components/bell-outcome-notice';
import { StageHeader, StageMain, StagePage } from '@stories/bell-notice-stage';
import { storyClock, withRaisedNotifications } from '@stories/notification-story-decorators';
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

function NoticeStage(): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <StagePage>
      <StageHeader bell={bell}>
        <Notice bellRef={bell} />
      </StageHeader>
      <StageMain save={save} heading={heading}>
        <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
      </StageMain>
    </StagePage>
  );
}

const meta: Meta<typeof NoticeStage> = {
  title: 'Modules/User/Notifications/BellOutcomeNotice',
  component: NoticeStage,
  tags: ['autodocs'],
  globals: { viewport: { value: 'xl', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The outcomes of a page: the shown rows as the merged card on desktop and ' +
          'the caret card on tablet and mobile, each with its time and a close button. Closing ' +
          'a row only removes it from the page and never marks it read. Retry dismisses the ' +
          'row through the port before the action runs and returns focus to Save, or to ' +
          'the bell when the page published no usable target. It loads as ' +
          'its own chunk, `notifications-notice`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NoticeStage>;

export const DesktopOneRow: Story = { decorators: [withRaisedNotifications(ONE, storyClock)] };

export const DesktopThreeRows: Story = { decorators: [withRaisedNotifications(THREE, storyClock)] };

export const TabletCaret: Story = {
  decorators: [withRaisedNotifications(THREE, storyClock)],
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const MobileCaret: Story = {
  decorators: [withRaisedNotifications(THREE, storyClock)],
  globals: { viewport: { value: 'xs', isRotated: false } },
};

export const TransientError: Story = {
  decorators: [withRaisedNotifications(TRANSIENT, storyClock)],
};
