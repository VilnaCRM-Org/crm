import type { EmailRowState } from '../hooks/use-email-row';
import type { ProfileFormRules } from '../hooks/use-profile-form-rules';
import type { ProfileEditContext } from '../hooks/use-profile-save';
import type { ProfileFormState } from '../user-profile/form-state';
import type { ProfileFieldErrorSet } from '../user-profile/outcome';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

export interface ProfileFormProps extends ProfileEditContext {
  readonly version: number;
  readonly refocus: boolean;
}

export interface ClearButtonProps {
  readonly defaults: ProfileFormValues;
  readonly busy: boolean;
  readonly onClear: () => void;
}

export interface ServerFieldErrorsProps {
  readonly errors: ProfileFieldErrorSet;
}

export interface ProfileFormFieldsProps {
  readonly rules: ProfileFormRules;
  readonly refocus: boolean;
  readonly state: ProfileFormState;
  readonly emailRow: EmailRowState;
}

export interface PersonalDetailsProps {
  readonly rules: ProfileFormRules;
  readonly refocus: boolean;
  readonly emailRow: EmailRowState;
}

export interface EmailStatusRowProps {
  readonly statusId: string;
  readonly busy: boolean;
  readonly onResend: () => void;
}

export interface EmailFieldProps {
  readonly rules: ProfileFormRules;
  readonly emailRow: EmailRowState;
}
