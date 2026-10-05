import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';

type DemoValues = { email: string };

type DemoProps = {
  label: string;
  placeholder: string;
  helperText: string;
  disabled: boolean;
  showError: boolean;
};

const REQUIRED_MESSAGE = 'Вкажіть електронну пошту';

function ControlledFieldDemo({
  label,
  placeholder,
  helperText,
  disabled,
  showError,
}: DemoProps): JSX.Element {
  const { control, trigger } = useForm<DemoValues>({ defaultValues: { email: '' } });

  useEffect(() => {
    if (showError) void trigger('email');
  }, [showError, trigger]);

  return (
    <UIFormInputField<DemoValues>
      control={control}
      name="email"
      id="ui-form-input-field-email"
      type="email"
      autoComplete="email"
      label={label}
      placeholder={placeholder}
      helperText={helperText}
      disabled={disabled}
      rules={{ required: REQUIRED_MESSAGE }}
    />
  );
}

const meta: Meta<typeof ControlledFieldDemo> = {
  title: 'Components/Inputs/UIFormInputField',
  component: ControlledFieldDemo,
  tags: ['autodocs'],
  args: {
    label: 'Електронна пошта',
    placeholder: 'name@example.com',
    helperText: '',
    disabled: false,
    showError: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          'A MUI TextField bound to react-hook-form through a Controller: it takes `control`, ' +
          '`name` and `rules`, marks itself invalid from the field state and shows the ' +
          'validation message as helper text. The story owns a one-field form; in the app ' +
          'the auth FormField wraps it with its visible label.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ControlledFieldDemo>;

export const Default: Story = {};

export const WithHelperText: Story = {
  args: { helperText: 'Ми надішлемо лист для підтвердження' },
};

export const ValidationError: Story = {
  args: { showError: true },
  parameters: {
    docs: {
      description: { story: 'The empty field after validation: invalid, with the rule message.' },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
