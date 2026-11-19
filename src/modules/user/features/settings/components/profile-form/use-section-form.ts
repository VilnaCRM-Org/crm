import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useCollapseFocus from '../../hooks/use-collapse-focus';
import useProfileFormModel from '../../hooks/use-profile-form-model';
import type { SectionForm, SectionOfflineNotices } from '../../types/components/profile-form';
import type { ProfileEditContext } from '../../types/hooks/use-profile-save';
import type { ProfileSection } from '../../types/user-profile/profile-section';

import styles from './styles';

const SAVE_LABELS: Record<ProfileSection, string> = {
  fullName: 'settings.profile.save_name',
  email: 'settings.profile.save_email',
  password: 'settings.profile.save',
};

const OFFLINE_NOTICES: Record<ProfileSection, SectionOfflineNotices> = {
  fullName: { clean: 'none', revealed: 'inline' },
  email: { clean: 'none', revealed: 'inline' },
  password: { clean: 'live', revealed: 'live' },
};

export default function useSectionForm(
  context: ProfileEditContext,
  section: ProfileSection
): SectionForm {
  const { t } = useTranslation();
  const [changed, setChanged] = useState(false);
  useCollapseFocus(section, changed);
  const revealed = section === 'password' || changed;

  return {
    model: useProfileFormModel(context, section),
    revealed,
    onChange: setChanged,
    submitLabel: t(SAVE_LABELS[section]),
    submittingLabel: t('settings.profile.saving'),
    submitSx: revealed ? styles.saveButton : styles.saveButtonHidden,
    offlineNotice: OFFLINE_NOTICES[section][revealed ? 'revealed' : 'clean'],
  };
}
