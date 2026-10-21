import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { ProfileUpdateOutcome } from '@/modules/user/features/settings/types/user-profile';
import {
  loadedProfile,
  STORY_USER,
  withProfileProvider,
  type ProfileProviderStub,
} from '@stories/profile-provider-decorators';
import { noop } from '@stories/story-callbacks';

import ProfileForm from './index';

const pendingSave = (): ProfileProviderStub => ({
  ...loadedProfile(),
  update: (): Promise<ProfileUpdateOutcome> => new Promise<ProfileUpdateOutcome>(() => undefined),
});

const wrongPassword = (): ProfileProviderStub => ({
  ...loadedProfile(),
  update: async (): Promise<ProfileUpdateOutcome> => ({
    kind: 'invalid',
    errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
  }),
});

const meta: Meta<typeof ProfileForm> = {
  title: 'Settings/ProfileForm',
  component: ProfileForm,
  tags: ['autodocs'],
  decorators: [withProfileProvider(loadedProfile())],
  args: {
    user: STORY_USER,
    adoption: { adopt: noop, confirm: noop, isCurrent: (): boolean => true },
    version: 0,
    refocus: false,
    toasts: { toasts: { items: [] }, announcement: '', alert: '', show: noop, dismiss: noop },
    saveRef: { current: null },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The profile form: the "Ваше ПІБ" row, personal details, the password pair with its ' +
          'rule list, Save and Очистити. Only what the user changed is validated and sent. ' +
          'Each story registers a Data provider stub behind `AUTH_TOKENS.ProfileProvider`, so ' +
          'nothing reaches the network: by default a Save echoes the change back as saved. ' +
          'Save with nothing changed shows the no-change status in any story; SavePending ' +
          'keeps a Save running, and WrongCurrentPassword answers it with the field error. ' +
          'The toast queue is a no-op here; the UserProfile page story shows the toasts.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileForm>;

export const Resting: Story = {};

export const Unconfirmed: Story = {
  args: { user: { ...STORY_USER, confirmed: false } },
};

export const SavePending: Story = {
  decorators: [withProfileProvider(pendingSave())],
  parameters: {
    docs: {
      description: {
        story:
          'Change the name, type any current password and press Save: the update never ' +
          'settles, so the form stays in its busy state with the spinner and the announcement.',
      },
    },
  },
};

export const WrongCurrentPassword: Story = {
  decorators: [withProfileProvider(wrongPassword())],
  parameters: {
    docs: {
      description: {
        story:
          'Change the name, type any current password and press Save: the update answers ' +
          'that the current password is wrong, so its field shows the error.',
      },
    },
  },
};

export const AfterRetry: Story = { args: { refocus: true } };

export const LegacyName: Story = {
  args: { user: { ...STORY_USER, fullName: 'admin', email: 'admin@example.com' } },
};
