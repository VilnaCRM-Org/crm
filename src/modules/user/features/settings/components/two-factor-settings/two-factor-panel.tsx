import Box from '@mui/material/Box';
import type { ComponentType, JSX } from 'react';
import { useTranslation } from 'react-i18next';

import usePreviousView from '../../hooks/use-previous-view';
import useTwoFactorHeading from '../../hooks/use-two-factor-heading';
import type {
  TwoFactorSettingsProps,
  TwoFactorSettingsView,
} from '../../types/two-factor/settings-view';

import ArrivalContext from './arrival-context';
import CardHeader from './card-header';
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
  const View = VIEWS[view.view];
  const from = usePreviousView(view.view);
  const heading = useTwoFactorHeading(view, from);
  const connected = view.view === 'on';

  return (
    <Box
      component="section"
      aria-label={t('settings.two_factor.title')}
      sx={connected ? styles.cardConnected : styles.card}
    >
      <CardHeader
        key={view.view}
        title={heading.title}
        focus={heading.focus}
        divided={!connected}
      />
      <ArrivalContext.Provider value={from}>
        <View settings={settings} view={view} callbacks={callbacks} isSubmitting={isSubmitting} />
      </ArrivalContext.Provider>
    </Box>
  );
}
