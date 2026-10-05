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
    id: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The connectivity notice inside UIForm (issue #147). The `role="status"` region is ' +
          'always mounted and only its text changes: the offline copy while offline, the ' +
          '"connection restored" copy for five seconds after a reconnection, and nothing ' +
          'otherwise. Flip the `online` control from off to on to see the restored message.',
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
