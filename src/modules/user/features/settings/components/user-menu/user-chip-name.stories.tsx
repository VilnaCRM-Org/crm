import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UserChipName from './user-chip-name';

const meta: Meta<typeof UserChipName> = {
  title: 'Settings/UserMenu/UserChipName',
  component: UserChipName,
  tags: ['autodocs'],
  args: { layout: 'desktop', name: 'Євгенія Маслова' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ position: 'relative', display: 'inline-block', height: 50, margin: 24 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The name inside the chip: a 121 px (138 px tablet) box that ends in an ellipsis at ' +
          'default spacing. Two hidden copies of the name, one with the page spacing and one at ' +
          'normal spacing, are measured, and the box and the chip widen by the difference under ' +
          'WCAG 1.4.12 text-spacing overrides, so the name is not cut short.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserChipName>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };

export const LongName: Story = { args: { name: 'Олександр Дуже-Довгопрізвищенко' } };

export const NameLess: Story = { args: { name: undefined } };
