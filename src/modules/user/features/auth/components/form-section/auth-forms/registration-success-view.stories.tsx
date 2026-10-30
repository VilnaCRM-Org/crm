import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import RegistrationSuccessView from './registration-success-view';

const meta: Meta<typeof RegistrationSuccessView> = {
  title: 'Auth/Registration/RegistrationSuccessView',
  component: RegistrationSuccessView,
  tags: ['autodocs'],
  args: {
    isClosing: false,
    onBack: noop,
    title: 'Вітаємо!',
    description: 'Ви успішно зареєструвалися',
    buttonLabel: 'Назад',
  },
  argTypes: {
    onBack: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The successful sign-up or sign-in result: decorative confetti and gears, the ' +
          'heading (focused on mount), the description in a polite status region and one ' +
          'button (back to the form after sign-up, "Продовжити" after sign-in).',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RegistrationSuccessView>;

export const Default: Story = {};

export const Closing: Story = {
  args: { isClosing: true },
};

export const SignIn: Story = {
  args: { description: 'Ви успішно увійшли', buttonLabel: 'Продовжити' },
};
