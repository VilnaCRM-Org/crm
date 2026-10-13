import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useCallback, useState } from 'react';

import UICheckbox from '@/components/ui-checkbox';

function ControlledCheckbox({
  label,
  initiallyChecked,
}: {
  label: string;
  initiallyChecked: boolean;
}): JSX.Element {
  const [checked, setChecked] = useState(initiallyChecked);
  const toggle = useCallback((): void => setChecked((prev) => !prev), []);

  return <UICheckbox label={label} checked={checked} onChange={toggle} />;
}

const meta: Meta<typeof ControlledCheckbox> = {
  title: 'Components/Inputs/UICheckbox',
  component: ControlledCheckbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A labelled checkbox. It wraps the ui-toolkit UiCheckbox: a 24 px box with a ' +
          '#D0D4D8 border, filled #1EAEFF with a white tick when checked.',
      },
    },
  },
  args: { label: 'Запамʼятати мене', initiallyChecked: false },
};

export default meta;

type Story = StoryObj<typeof ControlledCheckbox>;

export const Unchecked: Story = {};

export const Checked: Story = { args: { initiallyChecked: true } };
