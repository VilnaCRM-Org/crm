import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UIAppHeader from '.';

const meta: Meta<typeof UIAppHeader> = {
  title: 'Shell/UIAppHeader',
  component: UIAppHeader,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [withMemoryRouter('/settings')],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The 64 px banner of the app shell. Desktop (1440) draws a 1 px `#E1E7EA` border, ' +
          'tablet (1024) and mobile (375) draw none. Search, bell and list are disabled and ' +
          'described as "Not available yet"; the mobile header has no search. The user slot ' +
          "reserves the chip's box. The badge stories pass exactly 1 and 8, which is the " +
          'artifact for the badge parity rows; the app passes no count.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIAppHeader>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };

export const Mobile: Story = { args: { layout: 'mobile' } };

export const MobileWithNavigation: Story = {
  args: { layout: 'mobile', navigation: { items: storyItems, signOut: noop } },
};

export const DesktopWithBadges: Story = {
  args: { badgeCounts: { notifications: 1, tasks: 8 } },
};

export const TabletWithBadges: Story = {
  args: { layout: 'tablet', badgeCounts: { notifications: 1, tasks: 8 } },
};
