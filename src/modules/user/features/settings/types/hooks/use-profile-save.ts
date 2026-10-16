import type { TFunction } from 'i18next';
import type { Dispatch } from 'react';

import type ProfileChangeDetector from '../../utils/profile-change-detector';
import type { ProfileFormProps } from '../components/profile-form';
import type { ProfileFormState } from '../user-profile/form-state';
import type { ProfileFieldErrorSet } from '../user-profile/outcome';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

export interface ProfileSave {
  readonly state: ProfileFormState;
  readonly isSubmitting: boolean;
  readonly changes: ProfileChangeDetector;
  readonly save: (values: ProfileFormValues) => void;
  readonly clear: () => void;
}

export interface NoChangesAction {
  readonly type: 'no_changes';
}

export interface InvalidSaveAction {
  readonly type: 'invalid';
  readonly errors: ProfileFieldErrorSet;
}

export interface SettledSaveAction {
  readonly type: 'settled';
}

export interface ClearSaveAction {
  readonly type: 'clear';
}

export type ProfileFormAction =
  NoChangesAction | InvalidSaveAction | SettledSaveAction | ClearSaveAction;

export interface SaveSettleContext {
  readonly props: ProfileFormProps;
  readonly t: TFunction;
  readonly dispatch: Dispatch<ProfileFormAction>;
}
