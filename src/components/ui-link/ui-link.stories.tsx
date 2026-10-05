import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UILink from '@/components/ui-link';

const meta: Meta<typeof UILink> = {
  title: 'Components/Navigation/UILink',
  component: UILink,
  tags: ['autodocs'],
  args: {
    href: '/privacy-policy',
    children: 'Політика конфіденційності',
  },
  argTypes: {
    href: { control: 'text' },
    underline: { control: 'inline-radio', options: ['none', 'hover', 'always'] },
  },
  parameters: {
    docs: {
      description: {
        component: 'MUI Link under the CRM link theme, used in the footer and the auth forms.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UILink>;

export const Default: Story = {};

export const AlwaysUnderlined: Story = {
  args: { underline: 'always' },
};
