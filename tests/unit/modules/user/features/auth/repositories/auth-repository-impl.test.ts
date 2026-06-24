import AuthRepositoryImpl from '@auth/repositories/auth-repository-impl';
import type { AuthRepositoryDeps } from '@auth/types/auth-repository-deps';
import { buildEmail, buildFullName, buildPassword, buildToken, buildUserId } from '@tests/builders';

const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true as const, value });

const makeDeps = (): AuthRepositoryDeps =>
  ({
    loginAPI: { login: jest.fn() },
    registrationAPI: { register: jest.fn() },
    loginResponseMapper: { map: jest.fn() },
    registrationResponseMapper: { map: jest.fn() },
    authUiErrorMapper: { map: jest.fn() },
    abortDetector: { isAbortError: jest.fn().mockReturnValue(false) },
    authErrorFactory: {
      fromUiError: jest.fn((e) => ({ kind: 'unknown', ...e })),
    },
  }) as unknown as AuthRepositoryDeps;

describe('AuthRepositoryImpl', () => {
  it('returns an AuthSession on successful login', async () => {
    const deps = makeDeps();
    const email = buildEmail();
    const token = buildToken();
    (deps.loginAPI.login as jest.Mock).mockResolvedValue({ token });
    (deps.loginResponseMapper.map as jest.Mock).mockReturnValue(ok({ token, email }));
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.login({ email: buildEmail(), password: buildPassword() });

    expect(result).toEqual({ ok: true, value: { email, token } });
  });

  it('maps transport errors to a structured AuthError', async () => {
    const deps = makeDeps();
    (deps.loginAPI.login as jest.Mock).mockRejectedValue(new Error('network'));
    (deps.authUiErrorMapper.map as jest.Mock).mockReturnValue({
      displayMessage: 'Boom',
      retryable: true,
    });
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.login({ email: buildEmail(), password: buildPassword() });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBe('Boom');
    }
  });

  it('flags aborts without UI mapping', async () => {
    const deps = makeDeps();
    (deps.loginAPI.login as jest.Mock).mockRejectedValue(new DOMException('aborted', 'AbortError'));
    (deps.abortDetector.isAbortError as jest.Mock).mockReturnValue(true);
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.login({ email: buildEmail(), password: buildPassword() });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'network', displayMessage: '', retryable: false, aborted: true },
    });
    expect(deps.authUiErrorMapper.map).not.toHaveBeenCalled();
  });

  it('returns mapped error when login response is not ok', async () => {
    const deps = makeDeps();
    (deps.loginAPI.login as jest.Mock).mockResolvedValue({});
    (deps.loginResponseMapper.map as jest.Mock).mockReturnValue({
      ok: false,
      error: { displayMessage: 'Bad credentials', retryable: false },
    });
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.login({ email: buildEmail(), password: buildPassword() });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBe('Bad credentials');
    }
  });

  it('returns a SafeUserInfo on successful register', async () => {
    const deps = makeDeps();
    const safeUser = { id: buildUserId(), email: buildEmail(), fullName: buildFullName() };
    (deps.registrationAPI.register as jest.Mock).mockResolvedValue({});
    (deps.registrationResponseMapper.map as jest.Mock).mockReturnValue(ok(safeUser));
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.register({
      email: buildEmail(),
      password: buildPassword(),
      fullName: buildFullName(),
    });

    expect(result).toEqual({ ok: true, value: safeUser });
  });

  it('maps register errors to a structured AuthError', async () => {
    const deps = makeDeps();
    (deps.registrationAPI.register as jest.Mock).mockRejectedValue(new Error('conflict'));
    (deps.authUiErrorMapper.map as jest.Mock).mockReturnValue({
      displayMessage: 'Conflict',
      retryable: false,
    });
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.register({
      email: buildEmail(),
      password: buildPassword(),
      fullName: buildFullName(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBe('Conflict');
    }
  });

  it('returns mapped error when register response is not ok', async () => {
    const deps = makeDeps();
    (deps.registrationAPI.register as jest.Mock).mockResolvedValue({});
    (deps.registrationResponseMapper.map as jest.Mock).mockReturnValue({
      ok: false,
      error: { displayMessage: 'Validation failed', retryable: false },
    });
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.register({
      email: buildEmail(),
      password: buildPassword(),
      fullName: buildFullName(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBe('Validation failed');
    }
  });
});
