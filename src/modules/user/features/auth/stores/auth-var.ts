import preloadedAuthTokenSeed from '@/config/env/preloaded-auth-token';
import type { AuthState } from '@auth/types/auth-store';
import type { ReactiveVar } from '@auth/types/reactive-var';

import ReactiveVarFactory from './reactive-var';

const CLEARED_STATE: AuthState = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

export class AuthStateVar {
  private readonly cleared: AuthState = CLEARED_STATE;

  private readonly state: ReactiveVar<AuthState>;

  constructor() {
    this.state = new ReactiveVarFactory().create<AuthState>({
      ...this.cleared,
      token: preloadedAuthTokenSeed.read(),
    });
  }

  public reactiveVar(): ReactiveVar<AuthState> {
    return this.state;
  }

  public get(): AuthState {
    return this.state();
  }

  public set(partial: Partial<AuthState>): void {
    this.state({ ...this.state(), ...partial });
  }

  public reset(): void {
    this.state({ ...this.cleared });
  }

  public resetRegistration(): void {
    this.set({ user: null, registerError: null, registerLoading: false });
  }

  public clearLoginError(): void {
    this.set({ loginError: null });
  }
}

const authStateVar = new AuthStateVar();

export default authStateVar;
