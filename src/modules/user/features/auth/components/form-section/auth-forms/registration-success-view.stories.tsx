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
  },
  argTypes: {
    onBack: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The successful-registration result inside a `role="status"` region: confetti and ' +
          'gears illustrations, the heading (focused on mount), the description and the ' +
          'button back to the form.',
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
