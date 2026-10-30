export type LoginView = 'form' | 'error' | 'success';

export interface LoginViewInput {
  readonly error: string;
  readonly isSubmitting: boolean;
  readonly signedIn: boolean;
}

export interface LoginViewMemory {
  readonly errorShown: boolean;
  readonly returnCount: number;
}

export interface LoginViewState {
  readonly view: LoginView;
  readonly returnCount: number;
  back(): void;
}
