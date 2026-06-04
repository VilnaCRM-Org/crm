import AuthStoreActions from '@auth/repositories/auth-store-actions';
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
});
