import type { Meta, StoryObj } from '@storybook/react-webpack5';

import passwordValidator from '@/modules/user/lib/validations/password';
import { withFormProvider } from '@stories/form-decorators';

import ChangePassword from './index';

const meta: Meta<typeof ChangePassword> = {
  title: 'Settings/ChangePassword',
  component: ChangePassword,
  tags: ['autodocs'],
  args: {
    rules: { currentPassword: {}, newPassword: {} },
    evaluate: (value: string) => passwordValidator.evaluate(value),
    busy: false,
  },
  decorators: [withFormProvider({ currentPassword: '', newPassword: '' })],
  parameters: {
    docs: {
      description: {
        component:
          'The password section of the profile form: the current password, the optional new ' +
          'password with its hint, and the four policy rules marked met or unmet by icon plus ' +
          'text. It needs a form context and receives its rules as props.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ChangePassword>;

export const Empty: Story = {};

export const PartlyMet: Story = {
  decorators: [withFormProvider({ currentPassword: '', newPassword: 'Pa1' })],
};

export const Saving: Story = {
  args: { busy: true },
  decorators: [withFormProvider({ currentPassword: 'Current1', newPassword: 'Next12345' })],
};
