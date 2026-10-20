import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import ProfileForm from './index';

const meta: Meta<typeof ProfileForm> = {
  title: 'Settings/ProfileForm',
  component: ProfileForm,
  tags: ['autodocs'],
  args: {
    user: {
      id: '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01',
      fullName: 'Олена Петренко',
      email: 'olena.petrenko@example.com',
      confirmed: true,
    },
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
          'The profile form: personal details, the password pair with its rule list, Save and ' +
          'Очистити. Only what the user changed is validated and sent. Stories render against ' +
          'no backend, so a Save ends in the transient error toast.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileForm>;

export const Resting: Story = {};

export const AfterRetry: Story = { args: { refocus: true } };

export const LegacyName: Story = {
  args: {
    user: {
      id: '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01',
      fullName: 'admin',
      email: 'admin@example.com',
      confirmed: true,
    },
  },
};
