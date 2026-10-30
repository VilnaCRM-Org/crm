import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIForm from '@/components/ui-form';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import { noop } from '@stories/story-callbacks';
import {
  CALLBACKS,
  DISABLE_WRONG,
  DISABLED_SETTINGS,
  OFF,
  SETUP,
  SETUP_SETTINGS,
  SETUP_WRONG,
} from '@stories/two-factor-story-fixtures';

import ConfirmCodeField from './confirm-code-field';
import DisableCodeField from './disable-code-field';
import OffView from './off-view';
import SetupView from './setup-view';

import { TwoFactorPanel } from './index';

const meta: Meta<typeof OffView> = {
  title: 'Settings/TwoFactorSettings/Views',
  component: OffView,
  tags: ['autodocs'],
  args: { settings: DISABLED_SETTINGS, view: OFF, callbacks: CALLBACKS, isSubmitting: false },
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
          'The off and setup views and their code fields on their own, without the card, and ' +
          'the card reached through its index.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof OffView>;

export const OffViewOnly: Story = {};

export const SetupViewOnly: Story = {
  args: { settings: SETUP_SETTINGS, view: SETUP },
  render: (args) => (
    <SetupView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const ThroughTheIndex: Story = {
  render: (args) => (
    <TwoFactorPanel
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const ConfirmFieldOnly: Story = {
  args: { view: SETUP_WRONG },
  render: (args) => (
    <UIForm<TwoFactorDto>
      defaultValues={{ twoFactorCode: '' }}
      onSubmit={noop}
      title="Підтвердження"
      submitLabel="Підтвердити"
      submittingLabel="Перевірка…"
    >
      <ConfirmCodeField view={args.view} disabled={args.isSubmitting} />
    </UIForm>
  ),
};

export const DisableFieldOnly: Story = {
  args: { view: DISABLE_WRONG },
  render: (args) => (
    <UIForm<TwoFactorDto>
      defaultValues={{ twoFactorCode: '' }}
      onSubmit={noop}
      title="Підтвердження"
      submitLabel="Вимкнути"
      submittingLabel="Вимикаємо…"
    >
      <DisableCodeField view={args.view} />
    </UIForm>
  ),
};
