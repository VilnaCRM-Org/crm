import AuthStoreActions from '@auth/stores/auth-store-actions';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthSetState } from '@auth/types/auth-store';

const makeRepo = (over: Partial<AuthRepository> = {}): AuthRepository =>
  ({
    login: jest.fn().mockResolvedValue({ ok: true, value: { email: 'a@b.c', token: 't' } }),
    register: jest.fn().mockResolvedValue({ ok: true, value: { email: 'a@b.c' } }),
    ...over,
  }) as AuthRepository;

describe('AuthStoreActions', () => {
  it('sets session on successful login', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(makeRepo()).login(set, { email: 'a@b.c', password: 'p' });
    expect(set).toHaveBeenNthCalledWith(
      1,
      { loginLoading: true, loginError: null },
      false,
      'auth/loginUser/pending'
    );
    expect(set).toHaveBeenLastCalledWith(
      { loginLoading: false, email: 'a@b.c', token: 't', loginError: null },
      false,
      'auth/loginUser/fulfilled'
    );
  });

  it('stores a structured error on login failure', async () => {
    const error = {
      kind: 'authentication' as const,
      displayMessage: 'Invalid credentials',
      retryable: false,
    };
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({ login: jest.fn().mockResolvedValue({ ok: false, error }) })
    ).login(set, { email: 'a@b.c', password: 'bad' });
    expect(set).toHaveBeenLastCalledWith(
      { loginLoading: false, loginError: error },
      false,
      'auth/loginUser/rejected'
    );
  });

  it('keeps login error null on abort', async () => {
    const error = { kind: 'network' as const, displayMessage: '', retryable: false, aborted: true };
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({ login: jest.fn().mockResolvedValue({ ok: false, error }) })
    ).login(set, { email: 'a@b.c', password: 'p' });
    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('sets user on successful registration', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(makeRepo()).register(set, {
      fullName: 'A',
      email: 'a@b.c',
      password: 'p',
    });
    expect(set).toHaveBeenLastCalledWith(
      { registerLoading: false, user: { email: 'a@b.c' }, registerError: null },
      false,
      'auth/registerUser/fulfilled'
    );
  });

  it('stores a structured error on registration failure', async () => {
    const error = { kind: 'conflict' as const, displayMessage: 'Exists', retryable: false };
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({ register: jest.fn().mockResolvedValue({ ok: false, error }) })
    ).register(set, { fullName: 'A', email: 'a@b.c', password: 'p' });
    expect(set).toHaveBeenLastCalledWith(
      { registerLoading: false, registerError: error },
      false,
      'auth/registerUser/rejected'
    );
  });

  it('keeps register error null on abort', async () => {
    const error = { kind: 'network' as const, displayMessage: '', retryable: false, aborted: true };
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({ register: jest.fn().mockResolvedValue({ ok: false, error }) })
    ).register(set, { fullName: 'A', email: 'a@b.c', password: 'p' });
    expect(set).toHaveBeenLastCalledWith(
      { registerLoading: false },
      false,
      'auth/registerUser/aborted'
    );
  });

  it('clears login loading when the repository rejects unexpectedly', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({ login: jest.fn().mockRejectedValue(new Error('Unexpected failure')) })
    ).login(set, { email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith(
      {
        loginLoading: false,
        loginError: expect.objectContaining({ kind: 'unknown', retryable: false }),
      },
      false,
      'auth/loginUser/rejected'
    );
  });

  it('treats unexpected abort rejections as aborted login requests', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({
        login: jest
          .fn()
          .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError')),
      })
    ).login(set, { email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith({ loginLoading: false }, false, 'auth/loginUser/aborted');
  });

  it('normalizes unexpected non-Error login rejections', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(makeRepo({ login: jest.fn().mockRejectedValue('boom') })).login(
      set,
      {
        email: 'a@b.c',
        password: 'p',
      }
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

  it('preserves structured auth errors from rejected login calls', async () => {
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

  it('normalizes rejected Error objects with undefined messages', async () => {
    const error = new Error();
    error.message = undefined as unknown as string;
    const set = jest.fn() as unknown as AuthSetState;
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

  it('clears register loading when the repository rejects unexpectedly', async () => {
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

  it('treats rejected aborted registration errors as aborted requests', async () => {
    const set = jest.fn() as unknown as AuthSetState;
    await new AuthStoreActions(
      makeRepo({
        register: jest.fn().mockRejectedValue({
          kind: 'network',
          displayMessage: '',
          retryable: false,
          aborted: true,
        }),
      })
    ).register(set, { fullName: 'A', email: 'a@b.c', password: 'p' });

    expect(set).toHaveBeenLastCalledWith(
      { registerLoading: false },
      false,
      'auth/registerUser/aborted'
    );
  });
});
