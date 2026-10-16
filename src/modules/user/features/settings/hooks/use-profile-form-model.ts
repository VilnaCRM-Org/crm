import type { ProfileFormProps } from '../types/components/profile-form';
import type { ProfileFormModel } from '../types/hooks/use-profile-form-model';

import useEmailRow from './use-email-row';
import useProfileFormRules from './use-profile-form-rules';
import useProfileSave from './use-profile-save';

export default function useProfileFormModel(props: ProfileFormProps): ProfileFormModel {
  const { user } = props;
  const save = useProfileSave(props);
  const defaults = {
    fullName: user.fullName,
    email: user.email,
    currentPassword: '',
    newPassword: '',
  };

  return {
    save,
    rules: useProfileFormRules(user, save.changes),
    emailRow: useEmailRow(props, save.isSubmitting),
    defaults,
  };
}
