import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITypography from '@/components/ui-typography';

const meta: Meta<typeof UITypography> = {
  title: 'Components/Typography/UITypography',
  component: UITypography,
  tags: ['autodocs'],
  args: {
    children: 'Ласкаво просимо до VilnaCRM',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'medium16',
        'medium15',
        'medium14',
        'regular16',
        'bodyText18',
        'bodyText16',
        'bold22',
        'demi18',
        'button',
        'mobileText',
      ],
    },
    component: { control: false },
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Text primitive from @vilnacrm/ui-toolkit rendered with `inheritTheme`, so it uses ' +
          'the CRM theme variants. `variant` sets the look and `component` the element, which ' +
          'is how a heading keeps the right level whatever its size.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UITypography>;

export const Body: Story = {
  args: { variant: 'bodyText16' },
};

export const Heading: Story = {
  args: { variant: 'h4', component: 'h2' },
};

export const Medium: Story = {
  args: { variant: 'medium16' },
};

export const Bold: Story = {
  args: { variant: 'bold22' },
};
