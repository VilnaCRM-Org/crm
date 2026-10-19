import type { TFunction } from 'i18next';
import type { Dispatch, RefObject } from 'react';

import type { ToastQueue } from '@/components/types/ui-toast';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type ProfileChangeDetector from '../../utils/profile-change-detector';
import type { ProfileFormState } from '../user-profile/form-state';
import type { ProfileField, ProfileFieldErrorSet } from '../user-profile/outcome';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

import type { UserEntityAdoption } from './use-profile-load';

export interface ProfileEditContext {
  readonly user: UserEntity;
  readonly adoption: UserEntityAdoption;
  readonly toasts: ToastQueue;
  readonly saveRef: RefObject<HTMLButtonElement | null>;
}

export type SavedAspect = Exclude<ProfileField, 'currentPassword'>;

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

export interface PendingSaveAction {
  readonly type: 'pending';
}

export interface SettledSaveAction {
  readonly type: 'settled';
}

export interface ClearSaveAction {
  readonly type: 'clear';
}

export type ProfileFormAction =
  NoChangesAction | InvalidSaveAction | PendingSaveAction | SettledSaveAction | ClearSaveAction;

export interface SaveSettleContext {
  readonly props: ProfileEditContext;
  readonly t: TFunction;
  readonly dispatch: Dispatch<ProfileFormAction>;
}
