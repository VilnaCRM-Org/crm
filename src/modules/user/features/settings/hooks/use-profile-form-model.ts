import type { ProfileFormModel } from '../types/hooks/use-profile-form-model';
import type { ProfileEditContext } from '../types/hooks/use-profile-save';

import useEmailRow from './use-email-row';
import useProfileFormRules from './use-profile-form-rules';
import useProfileSave from './use-profile-save';

export default function useProfileFormModel(context: ProfileEditContext): ProfileFormModel {
  const { user } = context;
  const save = useProfileSave(context);
  const defaults = {
    fullName: user.fullName,
    email: user.email,
    currentPassword: '',
    newPassword: '',
  };

  return {
    save,
    rules: useProfileFormRules(user, save.changes),
    emailRow: useEmailRow(context, save.isSubmitting),
    defaults,
  };
}
