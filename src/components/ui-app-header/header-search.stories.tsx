import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HeaderSearch from './header-search';

const meta: Meta<typeof HeaderSearch> = {
  title: 'Shell/Header/HeaderSearch',
  component: HeaderSearch,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'drawer'] } },
  parameters: {
    docs: {
      description: {
        component:
          "The header search in Figma's disabled variant: `#EAECEE`, no border, `#969B9D` " +
          'placeholder and magnifier. A natively disabled input named "Search" described by ' +
          '"Not available yet": it takes no input, no focus and sends no request. The mobile ' +
          'header has no search at all; the `drawer` layout is the full-width copy at the top ' +
          'of the mobile navigation drawer.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderSearch>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };

export const Drawer: Story = { args: { layout: 'drawer' } };
