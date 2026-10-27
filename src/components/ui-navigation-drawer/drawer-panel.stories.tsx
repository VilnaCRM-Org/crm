import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import DrawerPanel from './drawer-panel';

const meta: Meta<typeof DrawerPanel> = {
  title: 'Shell/Drawer/DrawerPanel',
  component: DrawerPanel,
  tags: ['autodocs'],
  args: { items: storyItems, signOut: noop, onNavigate: noop },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ width: 313, height: 622, background: '#FFFFFF' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The content of the 313×622 panel: the disabled drawer search at 10,13 and one ' +
          "navigation with the sidebar's list in 60 px rows, ending with Sign out on a top border.",
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DrawerPanel>;

export const OnHome: Story = { decorators: [withMemoryRouter('/')] };

export const OnSettings: Story = { decorators: [withMemoryRouter('/settings')] };
