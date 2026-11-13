export interface RedirectLocationLike {
  pathname?: string;
  search?: string;
  hash?: string;
}

export type ArrivalNotice =
  'password_reset' | 'session_ended' | 'two_factor_expired' | 'account_locked';

export interface RedirectNavigationState {
  from?: RedirectLocationLike;
  focusMain?: boolean;
  notice?: ArrivalNotice | undefined;
}

export interface ArrivalNoticeSnapshot {
  readonly key: string;
  readonly notice: ArrivalNotice | null;
}
