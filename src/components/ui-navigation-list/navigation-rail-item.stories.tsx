import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ReactComponent as IntegrationsIcon } from '@/assets/icons/shell/globe-02.svg';
import { withMemoryRouter } from '@stories/router-decorators';

import NavigationRailItem from './navigation-rail-item';

const meta: Meta<typeof NavigationRailItem> = {
  title: 'Shell/Navigation/NavigationRailItem',
  component: NavigationRailItem,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/')],
  args: {
    layout: 'desktop',
    id: 'integrations',
    label: 'Інтеграції',
    icon: IntegrationsIcon,
    href: '/settings/integrations',
  },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  parameters: {
    docs: {
      description: {
        component:
          'One rail row: a 56×40 pill (60×44 on tablet for the 28 px icons) that takes the row ' +
          'hover and current states and shows the tooltip on hover and keyboard focus. Escape ' +
          'hides the tooltip without moving focus.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationRailItem>;

export const Default: Story = {};

export const Current: Story = { args: { current: true } };

export const Tablet: Story = { args: { layout: 'tablet' } };
