import type { Dispatch, RefObject } from 'react';

import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type ProfileChangeDetector from '../../utils/profile-change-detector';
import type { ProfileFormState } from '../user-profile/form-state';
import type { ProfileField, ProfileFieldErrorSet } from '../user-profile/outcome';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

import type { UserEntityAdoption } from './use-profile-load';

export interface ProfileEditContext {
  readonly user: UserEntity;
  readonly adoption: UserEntityAdoption;
  readonly saveRef: RefObject<HTMLElement | null>;
  readonly headingRef: RefObject<HTMLElement | null>;
}

export type SavedAspect = Exclude<ProfileField, 'currentPassword'>;

export interface ProfileSave {
  readonly state: ProfileFormState;
  readonly isSubmitting: boolean;
  readonly changes: ProfileChangeDetector;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly save: (values: ProfileFormValues) => void;
  readonly clear: () => void;
  readonly block: () => void;
}

export interface SectionTargets {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly focusRef: RefObject<HTMLElement | null>;
}

export interface SaveTarget extends SectionTargets {
  readonly remember: () => void;
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
  readonly saved: boolean;
}

export interface ClearSaveAction {
  readonly type: 'clear';
}

export interface BlockedSaveAction {
  readonly type: 'blocked';
}

export type ProfileFormAction =
  | NoChangesAction
  | InvalidSaveAction
  | PendingSaveAction
  | SettledSaveAction
  | ClearSaveAction
  | BlockedSaveAction;

export interface ProfileFormStore {
  readonly state: ProfileFormState;
  readonly dispatch: Dispatch<ProfileFormAction>;
}
