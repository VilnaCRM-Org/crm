import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import UIPinInput from '@/components/ui-pin-input';

interface CodeValues {
  code: string;
}

interface PinInputDemoProps {
  initialCode: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const cellLabel = (cell: number): string => `Цифра ${cell} з 6`;

function PinInputDemo({
  initialCode,
  error,
  helperText,
  disabled,
}: PinInputDemoProps): JSX.Element {
  const { control, reset } = useForm<CodeValues>({ defaultValues: { code: initialCode } });
  useEffect(() => reset({ code: initialCode }), [initialCode, reset]);

  return (
    <UIPinInput<CodeValues>
      control={control}
      name="code"
      rules={{}}
      label="Код підтвердження"
      cellLabel={cellLabel}
      error={error}
      helperText={helperText}
      disabled={disabled}
    />
  );
}

const meta: Meta<typeof PinInputDemo> = {
  title: 'Components/Inputs/UIPinInput',
  component: PinInputDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Six numeric cells for a one-time code. It wraps the ui-toolkit UiPinInput and ' +
          'binds it to react-hook-form. Cells have a #80878A border, hover #57595B, error ' +
          '#DC3939 and a 2px #404142 focus ring; the cell size is 49 x 64 below 768 px and ' +
          '64 x 86 from it. A paste of "123 456" fills the cells; Tab visits each cell.',
      },
    },
  },
  args: { initialCode: '' },
};

export default meta;

type Story = StoryObj<typeof PinInputDemo>;

export const Resting: Story = {};

export const Filled: Story = { args: { initialCode: '123456' } };

export const Error: Story = {
  args: {
    initialCode: '123',
    error: true,
    helperText: 'Невірний код. Спробуйте ще раз.',
  },
};

export const Disabled: Story = { args: { initialCode: '123456', disabled: true } };
