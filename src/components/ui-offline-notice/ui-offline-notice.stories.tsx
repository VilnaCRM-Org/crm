import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIOfflineNotice from '@/components/ui-offline-notice';

const meta: Meta<typeof UIOfflineNotice> = {
  title: 'Components/Feedback/UIOfflineNotice',
  component: UIOfflineNotice,
  tags: ['autodocs'],
  args: {
    id: 'offline-notice',
    online: false,
  },
  argTypes: {
    online: { control: 'boolean', description: 'Whether the browser reports a network' },
    live: { control: 'boolean', description: 'Whether the notice is its own status region' },
    id: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The connectivity notice inside UIForm (issue #147). Its text is the offline copy ' +
          'while offline, the "connection restored" copy for five seconds after a ' +
          'reconnection, and nothing otherwise. By default (`live`) the element is an ' +
          'always-mounted `role="status"` region whose text change is announced. With ' +
          '`live={false}` (UIForm `offlineNotice="inline"`) it renders the same text without a ' +
          "role and is read through the submit button's `aria-describedby` instead, so the " +
          'change is not announced twice. Flip the ' +
          '`online` control from off to on to see the restored message.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIOfflineNotice>;

export const Offline: Story = {};

export const Online: Story = {
  args: { online: true },
  parameters: {
    docs: {
      description: {
        story: 'A fresh mount that is already online announces nothing and paints nothing.',
      },
    },
  },
};

export const Inline: Story = {
  args: { live: false, online: false },
  parameters: {
    docs: {
      description: {
        story: 'The offline copy without a status role, described by the submit button it blocks.',
      },
    },
  },
};
