import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';
import i18n from '@/i18n';

import SettingsGrid from '../../components/settings-grid';
import UserProfileSettings from '../../components/user-profile-settings';
import useProfileLoad from '../../hooks/use-profile-load';

import settingsCatalogLoader from './settings-catalog-loader';
import styles from './styles';

settingsCatalogLoader.register(i18n);

export default function UserProfile(): JSX.Element {
  usePageTitle('settings.title');
  const { t } = useTranslation();
  const load = useProfileLoad();

  return (
    <UIContainer>
      <Box sx={styles.content}>
        <Box sx={styles.header}>
          <UITypography component="h1" sx={styles.heading}>
            {t('settings.heading')}
          </UITypography>
          <UITypography sx={styles.subtitle}>{t('settings.subtitle')}</UITypography>
        </Box>
        <SettingsGrid>
          <UserProfileSettings
            status={load.status}
            user={load.user}
            version={load.version}
            refocus={load.refocus}
            retry={load.retry}
            adoption={load.adoption}
          />
        </SettingsGrid>
      </Box>
    </UIContainer>
  );
}
