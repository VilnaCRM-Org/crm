import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UINavigationDrawer from '.';

const meta: Meta<typeof UINavigationDrawer> = {
  title: 'Shell/UINavigationDrawer',
  component: UINavigationDrawer,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/settings')],
  args: {
    open: true,
    id: 'navigation-drawer',
    items: storyItems,
    signOut: noop,
    onClose: noop,
    onNavigate: noop,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The mobile navigation as a modal dialog named "Main navigation": a 56 px header ' +
          'drawn above a `rgba(54,79,93,.05)` scrim with a 4 px blur, and a 313×622 panel at ' +
          '62,56 with the shadow `-9px 4px 33px`. The panel slides in over 200 ms (none under ' +
          "reduced motion). MUI's modal gives the focus trap, the hidden page, the scroll " +
          'lock and Escape.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UINavigationDrawer>;

export const Open: Story = {};

export const OpenOnHome: Story = { decorators: [withMemoryRouter('/')] };
