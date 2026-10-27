import Box from '@mui/material/Box';
import { type ComponentType, type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import UITypography from '@/components/ui-typography';

import usePreviousView from '../../hooks/use-previous-view';
import type {
  TwoFactorSettingsProps,
  TwoFactorSettingsView,
} from '../../types/two-factor/settings-view';

import ArrivalContext from './arrival-context';
import CodesView from './codes-view';
import DisableView from './disable-view';
import OffView from './off-view';
import OnView from './on-view';
import ReauthView from './reauth-view';
import RegenerateView from './regenerate-view';
import SetupView from './setup-view';
import styles from './styles';

const VIEWS: Record<TwoFactorSettingsView, ComponentType<TwoFactorSettingsProps>> = {
  off: OffView,
  setup: SetupView,
  codes: CodesView,
  on: OnView,
  disable: DisableView,
  regenerate: RegenerateView,
  reauth: ReauthView,
};

export default function TwoFactorPanel({
  settings,
  view,
  callbacks,
  isSubmitting,
}: TwoFactorSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const headingId = useId();
  const View = VIEWS[view.view];
  const from = usePreviousView(view.view);

  return (
    <Box component="section" aria-labelledby={headingId} sx={styles.card}>
      <UITypography component="h2" id={headingId} sx={styles.title}>
        {t('settings.two_factor.title')}
      </UITypography>
      <ArrivalContext.Provider value={from}>
        <View settings={settings} view={view} callbacks={callbacks} isSubmitting={isSubmitting} />
      </ArrivalContext.Provider>
    </Box>
  );
}
