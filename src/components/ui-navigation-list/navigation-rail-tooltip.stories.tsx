import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import NavigationRailTooltip from './navigation-rail-tooltip';

const meta: Meta<typeof NavigationRailTooltip> = {
  title: 'Shell/Navigation/NavigationRailTooltip',
  component: NavigationRailTooltip,
  tags: ['autodocs'],
  args: { label: 'Інтеграції', shape: 'desktop' },
  argTypes: {
    shape: {
      control: 'select',
      options: ['desktop', 'tablet', 'tabletProducts', 'tabletCompact', 'action'],
    },
  },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ position: 'relative', width: 240, height: 80 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The rail tooltip `386:26142`: a 6×20.79 caret in `#E1E7EA` and a white body with an ' +
          'inside 1 px `#E1E7EA` stroke, radius 8, padding 12/16, Inter 500 16/18 `#191B1E`, ' +
          'shadow `0 6px 17px rgba(37,42,49,.07)`. It is hidden from assistive technology: the ' +
          'row keeps its label as text.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationRailTooltip>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { shape: 'tablet' } };
