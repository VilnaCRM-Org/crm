import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import RegistrationNotification from './registration-notification';

const meta: Meta<typeof RegistrationNotification> = {
  title: 'Auth/Registration/RegistrationNotification',
  component: RegistrationNotification,
  tags: ['autodocs'],
  args: {
    view: 'success',
    isSubmitting: false,
    onShown: noop,
    onBack: noop,
    onRetry: noop,
  },
  argTypes: {
    view: { control: 'inline-radio', options: ['success', 'error'] },
    errorText: { control: 'text' },
    onShown: { control: false },
    onBack: { control: false },
    onRetry: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The fading overlay that shows the registration result over the sign-up form: the ' +
          'success view, or the error view with the resolved error text. Leaving the error ' +
          'view fades it out before handing control back to the form.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RegistrationNotification>;

export const Success: Story = {};

export const Failure: Story = {
  args: { view: 'error', errorText: 'Користувач з такою електронною поштою вже існує' },
};
