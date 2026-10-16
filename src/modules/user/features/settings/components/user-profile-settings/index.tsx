import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UILiveStatus from '@/components/ui-live-status';

import type { UserProfileSettingsProps } from '../../types/components/user-profile-settings';
import ProfileForm from '../profile-form';
import ProfileHeader from '../profile-header';

import ProfileLoadError from './profile-load-error';
import ProfileSkeleton from './profile-skeleton';
import styles from './styles';

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
  const { t } = useTranslation();

  return (
    <>
      <UILiveStatus message={status === 'loading' ? t('settings.profile.loading') : ''} />
      {status === 'loading' && <ProfileSkeleton />}
      {status === 'failed' && <ProfileLoadError onRetry={retry} focus={refocus} />}
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
