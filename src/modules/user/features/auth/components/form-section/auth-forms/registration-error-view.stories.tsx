import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import RegistrationErrorView from './registration-error-view';

const meta: Meta<typeof RegistrationErrorView> = {
  title: 'Auth/Registration/RegistrationErrorView',
  component: RegistrationErrorView,
  tags: ['autodocs'],
  args: {
    resolvedErrorText: 'Користувач з такою електронною поштою вже існує',
    isSubmitting: false,
    isClosing: false,
    onRetry: noop,
    onBack: noop,
  },
  argTypes: {
    onRetry: { control: false },
    onBack: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The failed-registration result: an illustration, the heading, the error message in ' +
          'an alert, a retry button (when a retry is possible) and the back-to-form button. ' +
          'Focus moves to the message on mount.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RegistrationErrorView>;

export const Default: Story = {};

export const Retrying: Story = {
  args: { isSubmitting: true },
};

export const WithoutRetry: Story = {
  args: { onRetry: undefined },
};
