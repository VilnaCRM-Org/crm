import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import DrawerHeader from './drawer-header';

const meta: Meta<typeof DrawerHeader> = {
  title: 'Shell/Drawer/DrawerHeader',
  component: DrawerHeader,
  tags: ['autodocs'],
  args: { onDismiss: noop },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The drawn 56 px drawer header `287:14667`: the 64 px header's content in a " +
          'shorter box. ' +
          'Its logo, bell, list and avatar are aria-hidden copies; only the `x-close` button, ' +
          "24 px in a 44 px target at the burger's position, is operable. Tapping the header " +
          'outside it dismisses the drawer.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DrawerHeader>;

export const Default: Story = {};
