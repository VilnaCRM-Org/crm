import AuthStoreActions from '@auth/stores/auth-store-actions';
import AuthStateVar from '@auth/stores/auth-var';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthRepository } from '@auth/types/auth-repository';

const makeRepo = (over: Partial<AuthRepository> = {}): AuthRepository =>
  ({
    login: jest.fn().mockResolvedValue({ ok: true, value: { email: 'a@b.c', token: 't' } }),
    register: jest.fn().mockResolvedValue({ ok: true, value: { email: 'a@b.c' } }),
    ...over,
  }) as AuthRepository;

const loginWith = (over: Partial<AuthRepository>): Promise<void> =>
  new AuthStoreActions(makeRepo(over)).login({ email: 'a@b.c', password: 'p' });

const registerWith = (over: Partial<AuthRepository>): Promise<void> =>
  new AuthStoreActions(makeRepo(over)).register({ fullName: 'A', email: 'a@b.c', password: 'p' });

describe('AuthStoreActions integration coverage', () => {
  beforeEach(() => AuthStateVar.reset());

  it('preserves a structured auth error thrown by login', async () => {
    const error: AuthError = { kind: 'server', displayMessage: 'Down', retryable: true };
    await loginWith({ login: jest.fn().mockRejectedValue(error) });
    expect(AuthStateVar.get()).toMatchObject({ loginLoading: false, loginError: error });
  });

  it('normalizes a non-Error thrown login rejection', async () => {
    await loginWith({ login: jest.fn().mockRejectedValue('boom') });
    expect(AuthStateVar.get().loginError).toMatchObject({ kind: 'unknown', retryable: false });
  });

  it('normalizes a thrown Error with an undefined message', async () => {
    const error = new Error();
    error.message = undefined as unknown as string;
    await loginWith({ login: jest.fn().mockRejectedValue(error) });
    expect(AuthStateVar.get().loginError).toMatchObject({ kind: 'unknown', retryable: false });
  });

  it.each([
    ['an abort marker object', { aborted: true }],
    ['an AbortError name', Object.assign(new Error('stopped'), { name: 'AbortError' })],
    ['an ABORT_ERR code', Object.assign(new Error('stopped'), { code: 'ABORT_ERR' })],
    ['an abort message', new Error('Request was aborted')],
    ['a cancel message', new Error('User cancelled the request')],
  ])('treats a thrown login rejection with %s as aborted', async (_label, error) => {
    await loginWith({ login: jest.fn().mockRejectedValue(error) });
    expect(AuthStateVar.get()).toMatchObject({ loginLoading: false, loginError: null });
  });

  it('normalizes a generic thrown register error', async () => {
    await registerWith({ register: jest.fn().mockRejectedValue(new Error('Unexpected failure')) });
    expect(AuthStateVar.get().registerError).toMatchObject({ kind: 'unknown', retryable: false });
  });

  it('treats a thrown abort-marker register rejection as aborted', async () => {
    await registerWith({ register: jest.fn().mockRejectedValue({ aborted: true }) });
    expect(AuthStateVar.get()).toMatchObject({ registerLoading: false, registerError: null });
  });

  it('applies a repository-reported error result to the auth state', async () => {
    const error: AuthError = {
      kind: 'authentication',
      displayMessage: 'Invalid',
      retryable: false,
    };
    await loginWith({ login: jest.fn().mockResolvedValue({ ok: false, error }) });
    expect(AuthStateVar.get().loginError).toEqual(error);
  });
});
