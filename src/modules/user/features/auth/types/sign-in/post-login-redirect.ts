export interface PostLoginRedirect {
  readonly signedIn: boolean;
  proceed(): void;
}
