import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  CALLBACKS,
  CODES,
  CODES_SETTINGS,
  DISABLE,
  ENABLED_SETTINGS,
  ON,
  REAUTH,
  REGENERATE,
} from '@stories/two-factor-story-fixtures';

import CodesView from './codes-view';
import DisableView from './disable-view';
import OnView from './on-view';
import ReauthView from './reauth-view';
import RegenerateView from './regenerate-view';

const meta: Meta<typeof OnView> = {
  title: 'Settings/TwoFactorSettings/Result views',
  component: OnView,
  tags: ['autodocs'],
  args: { settings: ENABLED_SETTINGS, view: ON, callbacks: CALLBACKS, isSubmitting: false },
  argTypes: {
    settings: { control: false },
    view: { control: false },
    callbacks: { control: false },
    isSubmitting: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The recovery codes, on, disable, regenerate and re-authentication views on their own.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof OnView>;

export const OnViewOnly: Story = {};

export const CodesViewOnly: Story = {
  args: { settings: CODES_SETTINGS, view: CODES },
  render: (args) => (
    <CodesView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const DisableViewOnly: Story = {
  args: { view: DISABLE },
  render: (args) => (
    <DisableView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const RegenerateViewOnly: Story = {
  args: { view: REGENERATE },
  render: (args) => (
    <RegenerateView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const ReauthViewOnly: Story = {
  args: { view: REAUTH },
  render: (args) => (
    <ReauthView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};
