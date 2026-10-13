export interface RedirectLocationLike {
  pathname?: string;
  search?: string;
  hash?: string;
}

export type ArrivalNotice = 'password_reset';

export interface RedirectNavigationState {
  from?: RedirectLocationLike;
  focusMain?: boolean;
  notice?: ArrivalNotice | undefined;
}
