import type { RefObject } from 'react';

import type { ToastQueue } from '@/components/types/ui-toast';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type { ProfileFormRules } from '../hooks/use-profile-form-rules';
import type { UserEntityAdoption } from '../hooks/use-profile-load';
import type { ProfileFormState } from '../user-profile/form-state';
import type { ProfileFieldErrorSet } from '../user-profile/outcome';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

export interface ProfileFormProps {
  readonly user: UserEntity;
  readonly adoption: UserEntityAdoption;
  readonly version: number;
  readonly refocus: boolean;
  readonly toasts: ToastQueue;
  readonly saveRef: RefObject<HTMLButtonElement | null>;
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

export interface EmailRowState {
  readonly confirmed: boolean;
  readonly busy: boolean;
  readonly resend: () => void;
}

export interface EmailFieldProps {
  readonly rules: ProfileFormRules;
  readonly emailRow: EmailRowState;
}
