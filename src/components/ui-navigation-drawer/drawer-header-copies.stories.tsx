import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import DrawerHeaderCopies from './drawer-header-copies';

const meta: Meta<typeof DrawerHeaderCopies> = {
  title: 'Shell/Drawer/DrawerHeaderCopies',
  component: DrawerHeaderCopies,
  tags: ['autodocs'],
  decorators: [
    (Story): JSX.Element => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: 24 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The bell, list and avatar copies in the drawer header. They are aria-hidden and not ' +
          'operable; the glyphs keep the disabled `#D0D4D8` of the header they cover, and the ' +
          'avatar is the 40 px `#E1E7EA` circle with the no-data person glyph.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DrawerHeaderCopies>;

export const Default: Story = {};
