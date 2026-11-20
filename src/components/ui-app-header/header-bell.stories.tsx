import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HeaderBell from './header-bell';

const meta: Meta<typeof HeaderBell> = {
  title: 'Shell/Header/HeaderBell',
  component: HeaderBell,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  parameters: {
    docs: {
      description: {
        component:
          "The bell's position in the header cluster. Without content it is the disabled " +
          'notifications `HeaderIconButton`, described "Not available yet"; with the content of ' +
          'a `shell.notifications` slot it renders that content inside `BellSlotFrame` and no ' +
          'disabled bell.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderBell>;

export const Disabled: Story = {};

export const DisabledWithBadge: Story = { args: { count: 1 } };

export const WithSlot: Story = {
  args: { children: <button type="button">Сповіщення</button> },
};
