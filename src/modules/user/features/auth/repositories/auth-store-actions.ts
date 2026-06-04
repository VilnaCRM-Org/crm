import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';

import type { AuthRepository, LoginResult, RegisterResult } from '../types/auth-repository';
import type { AuthSetState } from '../types/auth-store';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';

@injectable()
export default class AuthStoreActions {
  constructor(@inject(TOKENS.AuthRepository) private readonly repository: AuthRepository) {}

  private static applyLogin(set: AuthSetState, result: LoginResult): void {
    if (result.ok) {
      set(
        {
          loginLoading: false,
          email: result.value.email,
          token: result.value.token,
          loginError: null,
        },
        false,
        'auth/loginUser/fulfilled'
      );
      return;
    }
    if (result.error.aborted) {
      set({ loginLoading: false }, false, 'auth/loginUser/aborted');
      return;
    }
    set({ loginLoading: false, loginError: result.error }, false, 'auth/loginUser/rejected');
  }

  private static applyRegister(set: AuthSetState, result: RegisterResult): void {
    if (result.ok) {
      set(
        { registerLoading: false, user: result.value, registerError: null },
        false,
        'auth/registerUser/fulfilled'
      );
      return;
    }
    if (result.error.aborted) {
      set({ registerLoading: false }, false, 'auth/registerUser/aborted');
      return;
    }
    set(
      { registerLoading: false, registerError: result.error },
      false,
      'auth/registerUser/rejected'
    );
  }

  public async login(
    set: AuthSetState,
    credentials: LoginUserDto,
    signal?: AbortSignal
  ): Promise<void> {
    set({ loginLoading: true, loginError: null }, false, 'auth/loginUser/pending');
    AuthStoreActions.applyLogin(set, await this.repository.login(credentials, signal));
  }

  public async register(
    set: AuthSetState,
    credentials: RegisterUserDto,
    signal?: AbortSignal
  ): Promise<void> {
    set(
      { registerLoading: true, registerError: null, user: null },
      false,
      'auth/registerUser/pending'
    );
    AuthStoreActions.applyRegister(set, await this.repository.register(credentials, signal));
  }
}
