import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withFormProvider } from '@stories/form-decorators';
import { noop } from '@stories/story-callbacks';

import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';

import ClearButton from './clear-button';

const DEFAULTS: ProfileFormValues = {
  fullName: 'Олена Петренко',
  email: 'olena.petrenko@example.com',
  currentPassword: '',
  newPassword: '',
};

const meta: Meta<typeof ClearButton> = {
  title: 'Settings/ClearButton',
  component: ClearButton,
  tags: ['autodocs'],
  args: {
    defaults: DEFAULTS,
    busy: false,
    onClear: noop,
  },
  decorators: [withFormProvider(DEFAULTS)],
  parameters: {
    docs: {
      description: {
        component:
          'The outlined pill that puts the profile form back to what was loaded: fields ' +
          'restored, ' +
          'both passwords empty and masked, errors gone. A `type="button"` that never submits; ' +
          'it is `aria-disabled` while a save runs.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ClearButton>;

export const Idle: Story = {};

export const Disabled: Story = { args: { busy: true } };
