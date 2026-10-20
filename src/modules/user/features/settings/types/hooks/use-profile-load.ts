import type { UserEntity } from '@/modules/user/types/user/user-entity';

export type ProfileLoadStatus = 'loading' | 'failed' | 'ready';

export type AdoptLoadedUser = (user: UserEntity) => void;

export interface UserEntityAdoption {
  readonly adopt: AdoptLoadedUser;
  readonly confirm: (email: string, confirmed: boolean) => void;
  readonly isCurrent: (email: string) => boolean;
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
  readonly reload: boolean;
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
  readonly email: string;
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
