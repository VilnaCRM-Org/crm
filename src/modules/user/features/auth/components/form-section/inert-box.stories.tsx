import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIButton from '@/components/ui-button';

import InertBox from './inert-box';

const meta: Meta<typeof InertBox> = {
  title: 'Auth/Components/InertBox',
  component: InertBox,
  tags: ['autodocs'],
  args: {
    id: 'inert-box-demo',
    inert: false,
    children: <UIButton variant="outlined">Продовжити</UIButton>,
  },
  argTypes: {
    inert: { control: 'boolean', description: 'Remove the content from focus and interaction' },
    children: { control: false },
    id: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Box that toggles the native `inert` attribute. Sign-up uses it to take the form ' +
          'and the OAuth buttons out of the tab order and the accessibility tree while the ' +
          'registration result covers them.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InertBox>;

export const Interactive: Story = {};

export const Inert: Story = {
  args: { inert: true },
};
