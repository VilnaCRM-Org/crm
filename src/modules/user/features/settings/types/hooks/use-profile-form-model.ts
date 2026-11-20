import type { ProfileFormValues } from '../user-profile/profile-form-values';

import type { ProfileFormRules } from './use-profile-form-rules';
import type { ProfileSave } from './use-profile-save';

export interface ProfileFormModel {
  readonly save: ProfileSave;
  readonly rules: ProfileFormRules;
  readonly defaults: ProfileFormValues;
}
