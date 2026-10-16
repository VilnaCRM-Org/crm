import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkClickHandler, useOutletContext } from 'react-router';

import UIButton from '@/components/ui-button';
import UIContainer from '@/components/ui-container';
import UILink from '@/components/ui-link';
import UITypography from '@/components/ui-typography';
import useFeatureFlag from '@/hooks/use-feature-flag';
import usePageTitle from '@/hooks/use-page-title';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import styles from './styles';

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

function SettingsLink(): JSX.Element {
  const { t } = useTranslation();
  const handleClick = useLinkClickHandler<HTMLAnchorElement>(ROUTE_PATHS.settings, {
    state: FOCUS_ON_ARRIVAL,
  });

  return (
    <UILink href={ROUTE_PATHS.settings} onClick={handleClick} sx={styles.settingsLink}>
      {t('home.settings_link')}
    </UILink>
  );
}

export default function Home(): JSX.Element {
  usePageTitle('home.title');
  const { t } = useTranslation();
  const { signOut } = useOutletContext<ProtectedOutletContext>();
  const settingsEnabled = useFeatureFlag('userSettings');

  return (
    <UIContainer>
      <Box sx={styles.content}>
        <UITypography component="h1" sx={styles.heading}>
          {t('home.heading')}
        </UITypography>
        <UITypography sx={styles.description}>{t('home.description')}</UITypography>
        {settingsEnabled && <SettingsLink />}
        <UIButton variant="outlined" onClick={signOut} sx={styles.signOut}>
          {t('home.sign_out')}
        </UIButton>
      </Box>
    </UIContainer>
  );
}
