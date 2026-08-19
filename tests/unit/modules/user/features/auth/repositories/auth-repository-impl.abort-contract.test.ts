import type AuthRepositoryImpl from '@auth/repositories/auth-repository-impl';
import type { AuthRepositoryDeps } from '@auth/types/auth-repository-deps';
import { buildCredentials, buildToken, buildUser } from '@tests/builders';

const ABORTED_ERROR_SHAPE = {
  kind: 'network',
  displayMessage: '',
  retryable: false,
  aborted: true,
};

const makeDeps = (): AuthRepositoryDeps =>
  ({
    loginAPI: { login: jest.fn().mockResolvedValue({}) },
    registrationAPI: { register: jest.fn().mockResolvedValue({}) },
    loginResponseMapper: { map: jest.fn() },
    registrationResponseMapper: { map: jest.fn() },
    authUiErrorMapper: { map: jest.fn() },
    abortDetector: { isAbortError: jest.fn().mockReturnValue(false) },
    authErrorFactory: { fromUiError: jest.fn((error) => ({ kind: 'unknown', ...error })) },
  }) as unknown as AuthRepositoryDeps;

const loadRepository = async (deps: AuthRepositoryDeps): Promise<AuthRepositoryImpl> => {
  const { default: Repository } = await import('@auth/repositories/auth-repository-impl');

  return new Repository(deps);
};

describe('AuthRepositoryImpl abort contract', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns the pinned aborted AuthError when login is aborted', async () => {
    const deps = makeDeps();
    (deps.loginAPI.login as jest.Mock).mockRejectedValue(new Error('aborted'));
    (deps.abortDetector.isAbortError as jest.Mock).mockReturnValue(true);
    const repository = await loadRepository(deps);

    const result = await repository.login(buildCredentials());

    expect(result).toEqual({ ok: false, error: ABORTED_ERROR_SHAPE });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBe('');
      expect(result.error.retryable).toBe(false);
      expect(result.error.aborted).toBe(true);
      expect(result.error.kind).toBe('network');
    }
  });

  it('returns the same pinned aborted AuthError when registration is aborted', async () => {
    const deps = makeDeps();
    (deps.registrationAPI.register as jest.Mock).mockRejectedValue(new Error('aborted'));
    (deps.abortDetector.isAbortError as jest.Mock).mockReturnValue(true);
    const repository = await loadRepository(deps);

    const result = await repository.register(buildUser());

    expect(result).toEqual({ ok: false, error: ABORTED_ERROR_SHAPE });
    if (!result.ok) {
      expect(result.error.displayMessage).toBe('');
      expect(result.error.retryable).toBe(false);
      expect(result.error.aborted).toBe(true);
    }
  });

  it('keeps the aborted error distinct from a mapped transport error', async () => {
    const deps = makeDeps();
    (deps.loginAPI.login as jest.Mock).mockRejectedValue(new Error('boom'));
    (deps.authUiErrorMapper.map as jest.Mock).mockReturnValue({
      displayMessage: 'Something went wrong',
      retryable: true,
    });
    const repository = await loadRepository(deps);

    const result = await repository.login(buildCredentials());

    expect(result).toEqual({
      ok: false,
      error: { kind: 'unknown', displayMessage: 'Something went wrong', retryable: true },
    });
    if (!result.ok) {
      expect(result.error.aborted).toBeUndefined();
    }
  });

  it('forwards the caller abort signal to the login API', async () => {
    const deps = makeDeps();
    const credentials = buildCredentials();
    const controller = new AbortController();
    (deps.loginResponseMapper.map as jest.Mock).mockReturnValue({
      ok: true,
      value: { email: credentials.email, token: buildToken() },
    });
    const repository = await loadRepository(deps);

    await repository.login(credentials, controller.signal);

    expect(deps.loginAPI.login).toHaveBeenCalledWith(credentials, { signal: controller.signal });
  });

  it('forwards the caller abort signal to the registration API', async () => {
    const deps = makeDeps();
    const credentials = buildUser();
    const controller = new AbortController();
    (deps.registrationResponseMapper.map as jest.Mock).mockReturnValue({
      ok: true,
      value: { email: credentials.email, fullName: credentials.fullName },
    });
    const repository = await loadRepository(deps);

    await repository.register(credentials, controller.signal);

    expect(deps.registrationAPI.register).toHaveBeenCalledWith(credentials, {
      signal: controller.signal,
    });
  });
});
