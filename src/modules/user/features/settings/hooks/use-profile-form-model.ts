import type { ProfileFormModel } from '../types/hooks/use-profile-form-model';
import type { ProfileEditContext } from '../types/hooks/use-profile-save';
import type { ProfileSection } from '../types/user-profile/profile-section';

import useProfileFormRules from './use-profile-form-rules';
import useProfileSave from './use-profile-save';

export default function useProfileFormModel(
  context: ProfileEditContext,
  section: ProfileSection
): ProfileFormModel {
  const { user } = context;
  const save = useProfileSave(context, section);
  const defaults = {
    fullName: user.fullName,
    email: user.email,
    fullNamePassword: '',
    emailPassword: '',
    currentPassword: '',
    newPassword: '',
  };

  return {
    save,
    rules: useProfileFormRules(user, save.changes),
    defaults,
  };
}
