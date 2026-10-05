import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIButton from '@/components/ui-button';

const meta: Meta<typeof UIButton> = {
  title: 'Components/Inputs/UIButton',
  component: UIButton,
  tags: ['autodocs'],
  args: {
    children: 'Зареєструватися',
    variant: 'contained',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['contained', 'outlined', 'text'] },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    to: { control: 'text', description: 'Internal path; renders the button as a link' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The CRM button: MUI Button under the CRM button theme. It renders a `<button ' +
          'type="button">` by default and an `<a href>` when given `to` or `href`.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIButton>;

export const Contained: Story = {};

export const Outlined: Story = {
  args: { variant: 'outlined' },
};

export const Text: Story = {
  args: { variant: 'text' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
  parameters: {
    docs: {
      description: {
        story: 'MUI native loading state: the button is disabled and keeps its accessible name.',
      },
    },
  },
};

export const AsLink: Story = {
  args: { to: '/sign-in', children: 'Увійти' },
};
