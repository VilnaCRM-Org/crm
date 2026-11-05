import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { ProfileFormProps } from '../../types/components/profile-form';

import ProfileSectionForm from './profile-section-form';
import styles from './styles';

export default function ProfileForm({ refocus, ...context }: ProfileFormProps): JSX.Element {
  const { t } = useTranslation();
  const focusHeading = useFocusOnMount<HTMLHeadingElement>();

  return (
    <>
      <ProfileSectionForm context={context} section="fullName" />
      <UITypography
        component="h2"
        tabIndex={-1}
        ref={refocus ? focusHeading : undefined}
        sx={styles.sectionTitle}
      >
        {t('settings.profile.sections.personal')}
      </UITypography>
      <ProfileSectionForm context={context} section="email" />
      <ProfileSectionForm context={context} section="password" />
    </>
  );
}
