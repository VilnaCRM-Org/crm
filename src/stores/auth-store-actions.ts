import { injectable } from 'tsyringe';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import AbortErrorDetector from '@/utils/error/abort-error-detector';
import { LoginAPI, RegistrationAPI } from '@auth/repositories';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';

import type { AuthState } from './auth-types';

export type AuthSetState = (partial: Partial<AuthState>, replace?: false, action?: string) => void;

interface AuthStoreActionsDeps {
  loginAPI: LoginAPI;
  registrationAPI: RegistrationAPI;
  loginResponseMapper: LoginResponseMapper;
  registrationResponseMapper: RegistrationResponseMapper;
  authUiErrorMapper: AuthUiErrorMapper;
  abortDetector: AbortErrorDetector;
}

interface LoginContext {
  set: AuthSetState;
  apiResponse: unknown;
  email: string;
  deps: AuthStoreActionsDeps;
}

interface RegisterContext {
  set: AuthSetState;
  apiResponse: unknown;
  deps: AuthStoreActionsDeps;
}

interface ErrorContext {
  set: AuthSetState;
  err: unknown;
  deps: AuthStoreActionsDeps;
}

function resolveDeps(): AuthStoreActionsDeps {
  return {
    loginAPI: container.resolve<LoginAPI>(TOKENS.LoginAPI),
    registrationAPI: container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
    loginResponseMapper: container.resolve<LoginResponseMapper>(TOKENS.LoginResponseMapper),
    registrationResponseMapper: container.resolve<RegistrationResponseMapper>(
      TOKENS.RegistrationResponseMapper
    ),
    authUiErrorMapper: container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper),
    abortDetector: container.resolve<AbortErrorDetector>(TOKENS.AbortErrorDetector),
  };
}

@injectable()
export default class AuthStoreActions {
  private static applyLoginResult(ctx: LoginContext): void {
    const { set, apiResponse, email, deps } = ctx;
    const mapped = deps.loginResponseMapper.map(apiResponse, email);
    if (!mapped.ok) {
      set(
        { loginLoading: false, loginError: mapped.error.displayMessage },
        false,
        'auth/loginUser/rejected'
      );
      return;
    }
    set(
      {
        loginLoading: false,
        email: mapped.value.email,
        token: mapped.value.token,
        loginError: null,
      },
      false,
      'auth/loginUser/fulfilled'
    );
  }

  private static handleLoginError(ctx: ErrorContext): void {
    const { set, err, deps } = ctx;
    if (deps.abortDetector.isAbortError(err)) {
      set({ loginLoading: false }, false, 'auth/loginUser/aborted');
      return;
    }
    const uiError = deps.authUiErrorMapper.map(err);
    set(
      { loginLoading: false, loginError: uiError.displayMessage },
      false,
      'auth/loginUser/rejected'
    );
  }

  private static applyRegisterResult(ctx: RegisterContext): void {
    const { set, apiResponse, deps } = ctx;
    const mapped = deps.registrationResponseMapper.map(apiResponse);
    if (!mapped.ok) {
      set(
        {
          registerLoading: false,
          registerError: mapped.error.displayMessage,
          registerRetryable: mapped.error.retryable,
        },
        false,
        'auth/registerUser/rejected'
      );
      return;
    }
    set(
      {
        registerLoading: false,
        user: mapped.value,
        registerError: null,
        registerRetryable: undefined,
      },
      false,
      'auth/registerUser/fulfilled'
    );
  }

  private static handleRegisterError(ctx: ErrorContext): void {
    const { set, err, deps } = ctx;
    if (deps.abortDetector.isAbortError(err)) {
      set({ registerLoading: false }, false, 'auth/registerUser/aborted');
      return;
    }
    const uiError = deps.authUiErrorMapper.map(err);
    set(
      {
        registerLoading: false,
        registerError: uiError.displayMessage,
        registerRetryable: uiError.retryable,
      },
      false,
      'auth/registerUser/rejected'
    );
  }

  public async login(
    set: AuthSetState,
    credentials: LoginUserDto,
    signal?: AbortSignal
  ): Promise<void> {
    const deps = resolveDeps();
    set({ loginLoading: true, loginError: null }, false, 'auth/loginUser/pending');
    try {
      const apiResponse = await deps.loginAPI.login(credentials, { signal });
      AuthStoreActions.applyLoginResult({ set, apiResponse, email: credentials.email, deps });
    } catch (err) {
      AuthStoreActions.handleLoginError({ set, err, deps });
    }
  }

  public async register(
    set: AuthSetState,
    credentials: RegisterUserDto,
    signal?: AbortSignal
  ): Promise<void> {
    const deps = resolveDeps();
    set(
      { registerLoading: true, registerError: null, registerRetryable: undefined, user: null },
      false,
      'auth/registerUser/pending'
    );
    try {
      const apiResponse = await deps.registrationAPI.register(credentials, { signal });
      AuthStoreActions.applyRegisterResult({ set, apiResponse, deps });
    } catch (err) {
      AuthStoreActions.handleRegisterError({ set, err, deps });
    }
  }
}
