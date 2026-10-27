import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIForm from '@/components/ui-form';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { TwoFactorSettingsEntity } from '@/modules/user/types/user/two-factor-settings-entity';
import { noop } from '@stories/story-callbacks';

import type {
  TwoFactorSettingsCallbacks,
  TwoFactorSettingsViewState,
} from '../../types/two-factor/settings-view';

import ConfirmCodeField from './confirm-code-field';
import OffView from './off-view';
import SetupView from './setup-view';
import Panel from './two-factor-panel';

import { TwoFactorPanel } from './index';

const CALLBACKS: TwoFactorSettingsCallbacks = {
  start: noop,
  confirm: noop,
  done: noop,
  openDisable: noop,
  disable: noop,
  openRegenerate: noop,
  regenerate: noop,
  cancel: noop,
  retry: noop,
};

const NO_SECRETS: TwoFactorSettingsEntity = {
  status: 'disabled',
  otpauthUri: null,
  secret: null,
  recoveryCodes: null,
};

const SETUP_SETTINGS: TwoFactorSettingsEntity = {
  ...NO_SECRETS,
  otpauthUri:
    'otpauth://totp/VilnaCRM%3Airyna%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=VilnaCRM',
  secret: 'JBSWY3DPEHPK3PXP',
};

const viewOf = (
  view: TwoFactorSettingsViewState['view'],
  overrides: Partial<TwoFactorSettingsViewState> = {}
): TwoFactorSettingsViewState => ({
  view,
  fieldError: null,
  banner: null,
  statusCode: null,
  ...overrides,
});

const meta: Meta<typeof Panel> = {
  title: 'Settings/TwoFactorSettings',
  component: Panel,
  tags: ['autodocs'],
  args: {
    settings: NO_SECRETS,
    view: viewOf('off'),
    callbacks: CALLBACKS,
    isSubmitting: false,
  },
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
          'The two-factor section of the settings page: a card named by its level-2 heading ' +
          'that shows one view at a time. The off view explains the three steps and offers ' +
          '"Почати налаштування"; the setup view shows the QR code, the key in groups of four ' +
          'with a copy button, and the six-digit confirm field. The card follows the Figma ' +
          'frames 313:10242, 313:10480 and 313:10606.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const Off: Story = {};

export const OffBusy: Story = { args: { isSubmitting: true } };

export const OffRateLimited: Story = { args: { view: viewOf('off', { banner: 'rate_limited' }) } };

export const OffTransient: Story = { args: { view: viewOf('off', { banner: 'transient' }) } };

export const Setup: Story = { args: { settings: SETUP_SETTINGS, view: viewOf('setup') } };

export const SetupIncompleteCode: Story = {
  args: { settings: SETUP_SETTINGS, view: viewOf('setup', { fieldError: 'incomplete' }) },
};

export const SetupWrongCode: Story = {
  args: { settings: SETUP_SETTINGS, view: viewOf('setup', { fieldError: 'invalid_code' }) },
};

export const SetupBusy: Story = {
  args: { settings: SETUP_SETTINGS, view: viewOf('setup'), isSubmitting: true },
};

export const SetupTransient: Story = {
  args: { settings: SETUP_SETTINGS, view: viewOf('setup', { banner: 'transient' }) },
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

export const OffViewOnly: Story = {
  render: (args) => (
    <OffView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const SetupViewOnly: Story = {
  args: { settings: SETUP_SETTINGS, view: viewOf('setup') },
  render: (args) => (
    <SetupView
      settings={args.settings}
      view={args.view}
      callbacks={args.callbacks}
      isSubmitting={args.isSubmitting}
    />
  ),
};

export const ConfirmFieldOnly: Story = {
  args: { view: viewOf('setup', { fieldError: 'invalid_code' }) },
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
