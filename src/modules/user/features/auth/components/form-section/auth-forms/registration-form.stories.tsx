import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import RegistrationForm from './registration-form';

const meta: Meta<typeof RegistrationForm> = {
  title: 'Auth/Forms/RegistrationForm',
  component: RegistrationForm,
  tags: ['autodocs'],
  args: {
    onViewChange: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          'The complete sign-up form: UIForm with the registration fields, inside an InertBox ' +
          'that goes inert while the lazily loaded RegistrationNotification shows the success ' +
          'or error result over it. `onViewChange` reports the current view. The catalogue ' +
          'has no auth backend, so a valid submit cannot succeed here; the result views have ' +
          'their own stories.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RegistrationForm>;

export const Default: Story = {};
