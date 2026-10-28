import type { TwoFactorSettingsEntity } from '@/modules/user/types/user/two-factor-settings-entity';
import { noop } from '@stories/story-callbacks';

import type {
  TwoFactorSettingsCallbacks,
  TwoFactorSettingsViewState,
} from '../../types/two-factor/settings-view';

export const CALLBACKS: TwoFactorSettingsCallbacks = {
  start: noop,
  confirm: noop,
  done: noop,
  openDisable: noop,
  disable: noop,
  openRegenerate: noop,
  regenerate: noop,
  cancel: noop,
  signInAgain: noop,
};

export const OTPAUTH_URI =
  'otpauth://totp/VilnaCRM%3Airyna%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=VilnaCRM';

export const SECRET = 'JBSWY3DPEHPK3PXP';

export const DISABLED_SETTINGS: TwoFactorSettingsEntity = {
  status: 'disabled',
  otpauthUri: null,
  secret: null,
  recoveryCodes: null,
};

export const ENABLED_SETTINGS: TwoFactorSettingsEntity = {
  ...DISABLED_SETTINGS,
  status: 'enabled',
};

export const SETUP_SETTINGS: TwoFactorSettingsEntity = {
  ...DISABLED_SETTINGS,
  otpauthUri: OTPAUTH_URI,
  secret: SECRET,
};

export const CODES_SETTINGS: TwoFactorSettingsEntity = {
  ...ENABLED_SETTINGS,
  recoveryCodes: {
    items: [
      'K7QM-4RTD',
      'W2XB-9NHF',
      'P5ZC-1LVA',
      'D8GJ-6YSE',
      'T3UR-7KBN',
      'H4EW-2MQX',
      'C9FA-5ZPL',
      'N6VD-8JTG',
    ].map((value) => ({ value })),
  },
};

const CLEAN = { fieldError: null, banner: null, bannerOccurrence: 0, statusCode: null } as const;

export const OFF: TwoFactorSettingsViewState = { view: 'off', ...CLEAN };
export const OFF_RATE_LIMITED: TwoFactorSettingsViewState = { ...OFF, banner: 'rate_limited' };
export const OFF_TRANSIENT: TwoFactorSettingsViewState = { ...OFF, banner: 'transient' };
export const OFF_STALE: TwoFactorSettingsViewState = { ...OFF, statusCode: 'stale' };
export const SETUP: TwoFactorSettingsViewState = { view: 'setup', ...CLEAN };
export const SETUP_INCOMPLETE: TwoFactorSettingsViewState = { ...SETUP, fieldError: 'incomplete' };
export const SETUP_WRONG: TwoFactorSettingsViewState = { ...SETUP, fieldError: 'invalid_code' };
export const SETUP_RATE_LIMITED: TwoFactorSettingsViewState = { ...SETUP, banner: 'rate_limited' };
export const SETUP_TRANSIENT: TwoFactorSettingsViewState = { ...SETUP, banner: 'transient' };
export const CODES: TwoFactorSettingsViewState = { view: 'codes', ...CLEAN };
export const ON: TwoFactorSettingsViewState = { view: 'on', ...CLEAN };
export const ON_ALREADY: TwoFactorSettingsViewState = { ...ON, statusCode: 'already_on' };
export const DISABLE: TwoFactorSettingsViewState = { view: 'disable', ...CLEAN };
export const DISABLE_FORMAT: TwoFactorSettingsViewState = { ...DISABLE, fieldError: 'format' };
export const DISABLE_WRONG: TwoFactorSettingsViewState = { ...DISABLE, fieldError: 'invalid_code' };
export const DISABLE_TRANSIENT: TwoFactorSettingsViewState = { ...DISABLE, banner: 'transient' };
export const REGENERATE: TwoFactorSettingsViewState = { view: 'regenerate', ...CLEAN };
export const REGENERATE_RATE_LIMITED: TwoFactorSettingsViewState = {
  ...REGENERATE,
  banner: 'rate_limited',
};
export const REAUTH: TwoFactorSettingsViewState = { view: 'reauth', ...CLEAN };

export const PANEL_DESCRIPTION =
  'The two-factor section of the settings page: a card named by its level-2 heading that shows ' +
  'one view at a time. It follows the Figma frames 313:10242, 313:10480 and 313:10606; the ' +
  'views the frames do not draw are built from the story copy.';
