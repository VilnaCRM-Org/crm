import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  loadedProfile,
  STORY_USER,
  withProfileProvider,
} from '@stories/profile-provider-decorators';
import { noop } from '@stories/story-callbacks';

import ProfileSectionForm from './profile-section-form';

const CONTEXT = {
  user: STORY_USER,
  adoption: {
    adopt: noop,
    confirm: noop,
    isCurrent: (): boolean => true,
    revision: (): number => 0,
  },
  toasts: { toasts: { items: [] }, announcement: '', alert: '', show: noop, dismiss: noop },
  saveRef: { current: null },
};

const meta: Meta<typeof ProfileSectionForm> = {
  title: 'Settings/ProfileSectionForm',
  component: ProfileSectionForm,
  tags: ['autodocs'],
  decorators: [withProfileProvider(loadedProfile())],
  args: { context: CONTEXT, section: 'fullName' },
  parameters: {
    docs: {
      description: {
        component:
          'One of the three profile forms, each saving one thing with its own password. The ' +
          'name and e-mail forms show only their field at rest; once the value differs from the ' +
          'saved one they reveal a password field, a Save and Очистити. The password form keeps ' +
          'its fields and actions visible. Each story registers a Data provider stub behind ' +
          '`AUTH_TOKENS.ProfileProvider`, so a Save echoes the change back as saved.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileSectionForm>;

export const FullName: Story = {};

export const Email: Story = { args: { section: 'email' } };

export const UnconfirmedEmail: Story = {
  args: { section: 'email', context: { ...CONTEXT, user: { ...STORY_USER, confirmed: false } } },
};

export const Password: Story = { args: { section: 'password' } };
