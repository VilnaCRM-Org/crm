import Box from '@mui/material/Box';
import { type JSX, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import UIContainer from '@/components/ui-container';
import UIToastStack from '@/components/ui-toast';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';
import useToastQueue from '@/hooks/use-toast-queue';
import i18n from '@/i18n';

import SettingsGrid from '../../components/settings-grid';
import UserProfileSettings from '../../components/user-profile-settings';
import useProfileLoad from '../../hooks/use-profile-load';

import settingsCatalogLoader from './settings-catalog-loader';
import styles from './styles';

settingsCatalogLoader.register(i18n);

function SettingsHeading(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={styles.header}>
      <UITypography component="h1" sx={styles.heading}>
        {t('settings.heading')}
      </UITypography>
      <UITypography sx={styles.subtitle}>{t('settings.subtitle')}</UITypography>
    </Box>
  );
}

export default function UserProfile(): JSX.Element {
  usePageTitle('settings.title');
  const load = useProfileLoad();
  const toasts = useToastQueue();
  const saveRef = useRef<HTMLButtonElement>(null);

  return (
    <UIContainer>
      <Box sx={styles.content}>
        <SettingsHeading />
        <SettingsGrid>
          <UserProfileSettings
            status={load.status}
            user={load.user}
            version={load.version}
            refocus={load.refocus}
            retry={load.retry}
            adoption={load.adoption}
            toasts={toasts}
            saveRef={saveRef}
          />
        </SettingsGrid>
      </Box>
      <UIToastStack
        toasts={toasts.toasts}
        announcement={toasts.announcement}
        onDismiss={toasts.dismiss}
        returnFocusRef={saveRef}
      />
    </UIContainer>
  );
}
