import { useTranslation } from 'react-i18next';

import type { TwoFactorHeading } from '../types/hooks/two-factor-heading';
import type {
  TwoFactorSettingsView,
  TwoFactorSettingsViewState,
} from '../types/two-factor/settings-view';

export const CANCELLED_FROM: ReadonlySet<TwoFactorSettingsView> = new Set([
  'disable',
  'regenerate',
]);

const TITLE_KEYS = new Map<TwoFactorSettingsView, string>([
  ['off', 'settings.two_factor.setup.title'],
  ['setup', 'settings.two_factor.setup.title'],
  ['on', 'settings.two_factor.status.on'],
]);

function focusesOnArrival(
  view: TwoFactorSettingsViewState,
  from: TwoFactorSettingsView | null
): boolean {
  if (view.view === 'setup') return true;
  if (view.view !== 'on') return false;
  return view.statusCode !== null || (from !== null && !CANCELLED_FROM.has(from));
}

export default function useTwoFactorHeading(
  view: TwoFactorSettingsViewState,
  from: TwoFactorSettingsView | null
): TwoFactorHeading {
  const { t } = useTranslation();
  const key =
    view.statusCode === 'already_on'
      ? 'settings.two_factor.status.already_on'
      : (TITLE_KEYS.get(view.view) ?? 'settings.two_factor.title');

  return { title: t(key), focus: focusesOnArrival(view, from) };
}
