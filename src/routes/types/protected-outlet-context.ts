export interface ProtectedOutletContext {
  readonly signOut: () => void;
}

export interface ProtectedSession {
  token(): string | null;
  end(token: string): void;
}

export interface ProtectedSessionContext extends ProtectedOutletContext {
  readonly session: ProtectedSession;
}
