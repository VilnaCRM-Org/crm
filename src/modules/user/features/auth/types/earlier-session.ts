export interface EarlierSession {
  token(): string | null;
  signOut(): void;
}
