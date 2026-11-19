import type { Meta, StoryObj } from '@storybook/react-webpack5';

import OpenSettingsLink from '@auth/components/recovery-codes-notice/open-settings-link';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof OpenSettingsLink> = {
  title: 'Auth/Components/RecoveryCodesNotice/OpenSettingsLink',
  component: OpenSettingsLink,
  tags: ['autodocs'],
  decorators: [withMemoryRouter()],
  args: { onDismiss: noop },
  argTypes: { onDismiss: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'The "Відкрити налаштування" link of the low recovery codes notice: the kit UILink ' +
          'with href /settings, routed client-side through useLinkClickHandler with the ' +
          'focus-main arrival state. It dismisses the notice only on a click it routes, so a ' +
          'Ctrl, Meta or Shift click opens a new tab and leaves the notice in place. Golos ' +
          '16/24 SemiBold, #0074B5 underlined, and the shared 2px #404142 focus ring.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof OpenSettingsLink>;

export const Default: Story = {};
