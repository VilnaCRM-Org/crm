import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UINavigationDrawer from '.';

const meta: Meta<typeof UINavigationDrawer> = {
  title: 'Shell/UINavigationDrawer',
  component: UINavigationDrawer,
  tags: ['autodocs'],
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
          'The navigation below 768 px as a modal dialog named "Main navigation": a 56 px ' +
          'header drawn above a `rgba(54,79,93,.05)` scrim with a 4 px blur, and a panel under ' +
          'that header spanning the whole viewport width down to the bottom edge with no ' +
          'shadow (owner decision of 2026-11-05; the Figma frame draws a 313×622 panel at ' +
          '62,56). The panel slides in over 200 ms (none under reduced motion). ' +
          "MUI's modal gives the focus trap, the hidden page, the scroll lock and Escape.",
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UINavigationDrawer>;

export const Open: Story = { decorators: [withMemoryRouter('/settings')] };

export const OpenOnHome: Story = { decorators: [withMemoryRouter('/')] };

export const OpenOnSmallPhone: Story = {
  decorators: [withMemoryRouter('/settings')],
  globals: { viewport: { value: 'xs', isRotated: false } },
};

export const OpenOnLargePhone: Story = {
  decorators: [withMemoryRouter('/settings')],
  globals: { viewport: { value: 'sm', isRotated: false } },
};

export const OpenWithLiveBell: Story = {
  args: { liveBell: true },
  decorators: [withMemoryRouter('/settings')],
};
