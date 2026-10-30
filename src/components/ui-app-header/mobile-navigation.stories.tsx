import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import MobileNavigation from './mobile-navigation';

const meta: Meta<typeof MobileNavigation> = {
  title: 'Shell/Header/MobileNavigation',
  component: MobileNavigation,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/settings')],
  args: { items: storyItems, signOut: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The burger and the modal drawer it opens. Escape, the close button and a tap on the ' +
          'scrim return focus to the burger; a navigation row, Settings or Sign out close the ' +
          'drawer without restoring it, so the destination focuses its `<main>`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MobileNavigation>;

export const Closed: Story = {};
