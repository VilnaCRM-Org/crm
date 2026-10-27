import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  CALLBACKS,
  DISABLE,
  DISABLE_FORMAT,
  DISABLE_TRANSIENT,
  DISABLE_WRONG,
  ENABLED_SETTINGS,
  ON,
  PANEL_DESCRIPTION,
  REAUTH,
  REGENERATE,
  REGENERATE_RATE_LIMITED,
} from './story-fixtures';
import Panel from './two-factor-panel';

const meta: Meta<typeof Panel> = {
  title: 'Settings/TwoFactorSettings/Manage',
  component: Panel,
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
          `${PANEL_DESCRIPTION} With two-factor on, the card offers the outlined "Вимкнути" and ` +
          '"Створити нові резервні коди" buttons; each opens a confirmation that closes with ' +
          '"Скасувати" or Escape and returns focus to the button that opened it, and a ' +
          'regenerate refused for a stale sign-in shows the re-authentication message.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const OnWithActions: Story = {};

export const DisableConfirmation: Story = { args: { view: DISABLE } };

export const DisableFormatError: Story = { args: { view: DISABLE_FORMAT } };

export const DisableWrongCode: Story = { args: { view: DISABLE_WRONG } };

export const DisableTransient: Story = { args: { view: DISABLE_TRANSIENT } };

export const DisableBusy: Story = { args: { view: DISABLE, isSubmitting: true } };

export const RegenerateConfirmation: Story = { args: { view: REGENERATE } };

export const RegenerateRateLimited: Story = { args: { view: REGENERATE_RATE_LIMITED } };

export const Reauth: Story = { args: { view: REAUTH } };
