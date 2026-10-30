import { useTranslation } from 'react-i18next';

import type { TwoFactorSettingsViewState } from '../types/two-factor/settings-view';

const STATUS_KEYS = new Map<string, string>([
  ['on', 'settings.two_factor.status.on'],
  ['already_on', 'settings.two_factor.status.already_on'],
  ['stale', 'settings.two_factor.status.stale'],
  ['disabled', 'settings.two_factor.status.disabled'],
  ['already_off', 'settings.two_factor.status.already_off'],
]);

export default function useStatusText(view: TwoFactorSettingsViewState): string | null {
  const { t } = useTranslation();
  const key = STATUS_KEYS.get(view.statusCode ?? view.view);
  return key === undefined ? null : t(key);
}
