import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  CALLBACKS,
  CODES,
  CODES_SETTINGS,
  DISABLED_SETTINGS,
  ENABLED_SETTINGS,
  OFF,
  OFF_RATE_LIMITED,
  OFF_STALE,
  OFF_TRANSIENT,
  ON,
  ON_ALREADY,
  PANEL_DESCRIPTION,
  SETUP,
  SETUP_INCOMPLETE,
  SETUP_RATE_LIMITED,
  SETUP_SETTINGS,
  SETUP_TRANSIENT,
  SETUP_WRONG,
} from './story-fixtures';
import Panel from './two-factor-panel';

const meta: Meta<typeof Panel> = {
  title: 'Settings/TwoFactorSettings',
  component: Panel,
  tags: ['autodocs'],
  args: { settings: DISABLED_SETTINGS, view: OFF, callbacks: CALLBACKS, isSubmitting: false },
  argTypes: {
    settings: { control: false },
    view: { control: false },
    callbacks: { control: false },
    isSubmitting: { control: 'boolean' },
  },
  parameters: { docs: { description: { component: PANEL_DESCRIPTION }, story: { inline: false } } },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const Off: Story = {};

export const OffBusy: Story = { args: { isSubmitting: true } };

export const OffRateLimited: Story = { args: { view: OFF_RATE_LIMITED } };

export const OffTransient: Story = { args: { view: OFF_TRANSIENT } };

export const OffStale: Story = { args: { view: OFF_STALE } };

export const Setup: Story = { args: { settings: SETUP_SETTINGS, view: SETUP } };

export const SetupIncompleteCode: Story = {
  args: { settings: SETUP_SETTINGS, view: SETUP_INCOMPLETE },
};

export const SetupWrongCode: Story = { args: { settings: SETUP_SETTINGS, view: SETUP_WRONG } };

export const SetupBusy: Story = {
  args: { settings: SETUP_SETTINGS, view: SETUP, isSubmitting: true },
};

export const SetupRateLimited: Story = {
  args: { settings: SETUP_SETTINGS, view: SETUP_RATE_LIMITED },
};

export const SetupTransient: Story = {
  args: { settings: SETUP_SETTINGS, view: SETUP_TRANSIENT },
};

export const Codes: Story = { args: { settings: CODES_SETTINGS, view: CODES } };

export const On: Story = { args: { settings: ENABLED_SETTINGS, view: ON } };

export const OnAlreadyEnabled: Story = { args: { settings: ENABLED_SETTINGS, view: ON_ALREADY } };
