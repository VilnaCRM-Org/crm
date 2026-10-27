import Box from '@mui/material/Box';
import { type ComponentType, type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import UITypography from '@/components/ui-typography';

import type {
  TwoFactorSettingsProps,
  TwoFactorSettingsView,
} from '../../types/two-factor/settings-view';

import CodesView from './codes-view';
import OffView from './off-view';
import OnView from './on-view';
import SetupView from './setup-view';
import styles from './styles';

const VIEWS = new Map<TwoFactorSettingsView, ComponentType<TwoFactorSettingsProps>>([
  ['off', OffView],
  ['setup', SetupView],
  ['codes', CodesView],
  ['on', OnView],
]);

export default function TwoFactorPanel({
  settings,
  view,
  callbacks,
  isSubmitting,
}: TwoFactorSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const headingId = useId();
  const View = VIEWS.get(view.view);

  return (
    <Box component="section" aria-labelledby={headingId} sx={styles.card}>
      <UITypography component="h2" id={headingId} sx={styles.title}>
        {t('settings.two_factor.title')}
      </UITypography>
      {View !== undefined && (
        <View settings={settings} view={view} callbacks={callbacks} isSubmitting={isSubmitting} />
      )}
    </Box>
  );
}
