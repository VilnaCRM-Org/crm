import Box from '@mui/material/Box';
import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UILiveStatus from '@/components/ui-live-status';

import type {
  ProfileLoadAnnouncementsProps,
  UserProfileSettingsProps,
} from '../../types/components/user-profile-settings';
import ProfileForm from '../profile-form';
import ProfileHeader from '../profile-header';

import ProfileLoadError from './profile-load-error';
import ProfileSkeleton from './profile-skeleton';
import styles from './styles';

function ProfileLoadAnnouncements({ status }: ProfileLoadAnnouncementsProps): JSX.Element {
  const { t } = useTranslation();
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    setLoadingText(status === 'loading' ? t('settings.profile.loading') : '');
  }, [status, t]);

  return (
    <>
      <UILiveStatus message={loadingText} />
      <UILiveStatus
        politeness="assertive"
        message={status === 'failed' ? t('settings.profile.load_failed') : ''}
      />
    </>
  );
}

export default function UserProfileSettings({
  status,
  user,
  version,
  refocus,
  retry,
  adoption,
  toasts,
  saveRef,
}: UserProfileSettingsProps): JSX.Element {
  return (
    <>
      <ProfileLoadAnnouncements status={status} />
      {status === 'loading' && (
        <Box sx={styles.card}>
          <ProfileSkeleton />
        </Box>
      )}
      {status === 'failed' && (
        <Box sx={styles.card}>
          <ProfileLoadError onRetry={retry} focus={refocus} />
        </Box>
      )}
      {status === 'ready' && user && (
        <Box sx={styles.card}>
          <ProfileHeader fullName={user.fullName} />
          <ProfileForm
            user={user}
            adoption={adoption}
            version={version}
            refocus={refocus}
            toasts={toasts}
            saveRef={saveRef}
          />
        </Box>
      )}
    </>
  );
}
