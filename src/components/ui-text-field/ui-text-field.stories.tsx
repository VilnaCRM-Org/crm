import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITextField from '@/components/ui-text-field';

const meta: Meta<typeof UITextField> = {
  title: 'Components/Inputs/UITextField',
  component: UITextField,
  tags: ['autodocs'],
  args: {
    id: 'ui-text-field-name',
    label: "Ім'я та прізвище",
    placeholder: 'Михайло Светлов',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    helperText: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Uncontrolled MUI TextField under the CRM text-field theme.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UITextField>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: true, helperText: "Вкажіть ім'я та прізвище" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
