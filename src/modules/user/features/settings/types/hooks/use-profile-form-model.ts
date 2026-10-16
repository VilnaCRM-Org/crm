import type { EmailRowState } from '../components/profile-form';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

import type { ProfileFormRules } from './use-profile-form-rules';
import type { ProfileSave } from './use-profile-save';

export interface ProfileFormModel {
  readonly save: ProfileSave;
  readonly rules: ProfileFormRules;
  readonly emailRow: EmailRowState;
  readonly defaults: ProfileFormValues;
}
