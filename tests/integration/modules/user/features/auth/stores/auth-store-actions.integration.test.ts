import AuthStoreActions from '@auth/stores/auth-store-actions';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthSetState } from '@auth/types/auth-store';

const makeRepo = (overrides: Partial<AuthRepository> = {}): AuthRepository =>
  ({
    login: jest.fn().mockResolvedValue({ ok: true, value: { email: 'a@b.c', token: 't' } }),
    register: jest.fn().mockResolvedValue({ ok: true, value: { email: 'a@b.c' } }),
    ...overrides,
  }) as AuthRepository;

describe('AuthStoreActions integration coverage', () => {
  it('preserves auth-shaped login rejections', async () => {
    const error = {
      kind: 'server' as const,
      displayMessage: 'Server unavailable',
      retryable: true,
    };
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(makeRepo({ login: jest.fn().mockRejectedValue(error) })).login(set, {
      email: 'a@b.c',
      password: 'p',
    });

    expect(set).toHaveBeenLastCalledWith(
      { loginLoading: false, loginError: error },
      false,
      'auth/loginUser/rejected'
    );
  });

  it('normalizes unexpected string login rejections', async () => {
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(makeRepo({ login: jest.fn().mockRejectedValue('boom') })).login(
      set,
      { email: 'a@b.c', password: 'p' }
    );

    expect(set).toHaveBeenLastCalledWith(
      {
        loginLoading: false,
        loginError: expect.objectContaining({ kind: 'unknown', retryable: false }),
      },
      false,
      'auth/loginUser/rejected'
    );
  });

  it('treats abort-marker login rejections as aborted', async () => {
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(
      makeRepo({ login: jest.fn().mockRejectedValue({ aborted: true }) })
    ).login(set, { email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('treats AbortError-name login rejections as aborted', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    const error = new Error('Operation cancelled');
    error.name = 'AbortError';

    await new AuthStoreActions(makeRepo({ login: jest.fn().mockRejectedValue(error) })).login(set, {
      email: 'a@b.c',
      password: 'p',
    });

    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('treats ABORT_ERR login rejections as aborted', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    const error = Object.assign(new Error('Request stopped'), { code: 'ABORT_ERR' });

    await new AuthStoreActions(makeRepo({ login: jest.fn().mockRejectedValue(error) })).login(set, {
      email: 'a@b.c',
      password: 'p',
    });

    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('treats abort-message login rejections as aborted', async () => {
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(
      makeRepo({ login: jest.fn().mockRejectedValue(new Error('Request was aborted by user')) })
    ).login(set, { email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('treats cancel-message login rejections as aborted', async () => {
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(
      makeRepo({ login: jest.fn().mockRejectedValue(new Error('User cancelled the request')) })
    ).login(set, { email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('normalizes undefined-message login rejections', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    const error = new Error();
    error.message = undefined as unknown as string;

    await new AuthStoreActions(makeRepo({ login: jest.fn().mockRejectedValue(error) })).login(set, {
      email: 'a@b.c',
      password: 'p',
    });

    expect(set).toHaveBeenLastCalledWith(
      {
        loginLoading: false,
        loginError: expect.objectContaining({ kind: 'unknown', retryable: false }),
      },
      false,
      'auth/loginUser/rejected'
    );
  });

  it('preserves auth-shaped register rejections', async () => {
    const error = {
      kind: 'conflict' as const,
      displayMessage: 'Already exists',
      retryable: false,
    };
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(makeRepo({ register: jest.fn().mockRejectedValue(error) })).register(
      set,
      {
        fullName: 'A',
        email: 'a@b.c',
        password: 'p',
      }
    );

    expect(set).toHaveBeenLastCalledWith(
      { registerLoading: false, registerError: error },
      false,
      'auth/registerUser/rejected'
    );
  });

  it('normalizes unexpected register rejections', async () => {
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(
      makeRepo({ register: jest.fn().mockRejectedValue(new Error('Unexpected failure')) })
    ).register(set, { fullName: 'A', email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith(
      {
        registerLoading: false,
        registerError: expect.objectContaining({ kind: 'unknown', retryable: false }),
      },
      false,
      'auth/registerUser/rejected'
    );
  });

  it('treats abort-marker register rejections as aborted', async () => {
    const set = jest.fn() as unknown as AuthSetState;

    await new AuthStoreActions(
      makeRepo({ register: jest.fn().mockRejectedValue({ aborted: true }) })
    ).register(set, { fullName: 'A', email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith(
      { registerLoading: false },
      false,
      'auth/registerUser/aborted'
    );
  });
});
