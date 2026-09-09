export interface RedirectLocationLike {
  pathname?: string;
  search?: string;
  hash?: string;
}

export interface RedirectNavigationState {
  from?: RedirectLocationLike;
  focusMain?: boolean;
}
