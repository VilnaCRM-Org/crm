import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import MenuToggleButton from './menu-toggle-button';

const meta: Meta<typeof MenuToggleButton> = {
  title: 'Shell/Header/MenuToggleButton',
  component: MenuToggleButton,
  tags: ['autodocs'],
  args: { open: false, onToggle: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The burger: a 24 px `menu-04` glyph in `#57595B` at 336,16, inside a transparent ' +
          '44 px target. It is named "Open menu", reports `aria-expanded` and ' +
          '`aria-haspopup="dialog"`, and carries `aria-controls` only while the drawer it ' +
          'opens is mounted.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MenuToggleButton>;

export const Closed: Story = {};

export const Open: Story = { args: { open: true, controls: 'navigation-drawer' } };
