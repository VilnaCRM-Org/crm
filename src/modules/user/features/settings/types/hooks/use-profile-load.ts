import type { UserEntity } from '@/modules/user/types/user/user-entity';

export type ProfileLoadStatus = 'loading' | 'failed' | 'ready';

export interface UserEntityAdoption {
  readonly adopt: (user: UserEntity) => void;
  readonly confirm: (confirmed: boolean) => void;
}

export interface ProfileLoadState {
  readonly status: ProfileLoadStatus;
  readonly user: UserEntity | null;
  readonly version: number;
  readonly refocus: boolean;
  readonly retry: () => void;
  readonly adoption: UserEntityAdoption;
}

export interface ProfileLoadReducerState {
  readonly status: ProfileLoadStatus;
  readonly user: UserEntity | null;
  readonly version: number;
  readonly refocus: boolean;
  readonly attempt: number;
}

export interface RetryProfileLoadAction {
  readonly type: 'retry';
}

export interface AdoptUserAction {
  readonly type: 'adopt';
  readonly user: UserEntity;
}

export interface ConfirmUserAction {
  readonly type: 'confirm';
  readonly confirmed: boolean;
}

export interface ProfileLoadedAction {
  readonly type: 'loaded';
  readonly user: UserEntity;
}

export interface ProfileLoadFailedAction {
  readonly type: 'failed';
}

export type ProfileLoadAction =
  | RetryProfileLoadAction
  | AdoptUserAction
  | ConfirmUserAction
  | ProfileLoadedAction
  | ProfileLoadFailedAction;
