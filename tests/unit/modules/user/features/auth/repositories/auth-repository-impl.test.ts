import AuthRepositoryImpl from '@auth/repositories/auth-repository-impl';
import type { AuthRepositoryDeps } from '@auth/types/auth-repository-deps';
import { buildEmail, buildFullName, buildPassword, buildUserId } from '@tests/builders';
import { assertError } from '@tests/utils/assert-result';

const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true as const, value });

const makeDeps = (): AuthRepositoryDeps =>
  ({
    registrationAPI: { register: jest.fn() },
    registrationResponseMapper: { map: jest.fn() },
    authUiErrorMapper: { map: jest.fn() },
    abortDetector: { isAbortError: jest.fn().mockReturnValue(false) },
    authErrorFactory: {
      fromUiError: jest.fn((e) => ({ kind: 'unknown', ...e })),
    },
  }) as unknown as AuthRepositoryDeps;

describe('AuthRepositoryImpl', () => {
  it('exposes no REST login', () => {
    const repo = new AuthRepositoryImpl(makeDeps());

    expect(repo).not.toHaveProperty('login');
  });

  it('flags aborts without UI mapping', async () => {
    const deps = makeDeps();
    (deps.registrationAPI.register as jest.Mock).mockRejectedValue(
      new DOMException('aborted', 'AbortError')
    );
    (deps.abortDetector.isAbortError as jest.Mock).mockReturnValue(true);
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.register({
      email: buildEmail(),
      password: buildPassword(),
      fullName: buildFullName(),
    });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'network', displayMessage: '', retryable: false, aborted: true },
    });
    expect(deps.authUiErrorMapper.map).not.toHaveBeenCalled();
  });

  it('returns a SafeUserInfo on successful register', async () => {
    const deps = makeDeps();
    const credentials = {
      email: buildEmail(),
      password: buildPassword(),
      fullName: buildFullName(),
    };
    const safeUser = {
      id: buildUserId(),
      email: credentials.email,
      fullName: credentials.fullName,
    };
    (deps.registrationAPI.register as jest.Mock).mockResolvedValue({});
    (deps.registrationResponseMapper.map as jest.Mock).mockReturnValue(ok(safeUser));
    const repo = new AuthRepositoryImpl(deps);

    const result = await repo.register(credentials);

    expect(deps.registrationAPI.register).toHaveBeenCalledWith(credentials, { signal: undefined });
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

    assertError(result);
    expect(result.error.displayMessage).toBe('Conflict');
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

    assertError(result);
    expect(result.error.displayMessage).toBe('Validation failed');
  });
});
