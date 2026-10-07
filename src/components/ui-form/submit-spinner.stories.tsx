import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { paletteColors } from '@/styles/colors';

import SubmitSpinner from './submit-spinner';

const meta: Meta<typeof SubmitSpinner> = {
  title: 'Components/Inputs/UIForm/SubmitSpinner',
  component: SubmitSpinner,
  tags: ['autodocs'],
  decorators: [
    (Story): JSX.Element => (
      <div
        style={{
          display: 'inline-flex',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          backgroundColor: paletteColors.primary.main,
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The white loading indicator inside the busy submit button (28 px, 40 px from `md` ' +
          'up). It is `aria-hidden`: the form announces the submitting state through its live ' +
          'region instead. Shown on the brand colour because it is invisible on white.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SubmitSpinner>;

export const Default: Story = {};
