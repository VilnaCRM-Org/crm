import { ApiError } from '@/modules/user';
import ErrorParser from '@/utils/error/error-parser';
import type AuthErrorFactoryClass from '@auth/repositories/auth-error-factory';
import loadIsolated from '@tests/unit/utils/isolated-module';

const UI_ERROR = { displayMessage: 'Boom', retryable: true };

// KIND_BY_CODE is a module-level map, so the module is evaluated inside the test body to keep a
// mutant in it reachable by an assertion (issue #171).
const loadFactory = (): Promise<AuthErrorFactoryClass> =>
  loadIsolated(async () => {
    const { default: AuthErrorFactory } = await import('@auth/repositories/auth-error-factory');
    return new AuthErrorFactory(new ErrorParser());
  });

describe('AuthErrorFactory', () => {
  it('reports an unknown kind when no originating error is supplied', async () => {
    const factory = await loadFactory();

    expect(factory.fromUiError(UI_ERROR)).toEqual({
      kind: 'unknown',
      displayMessage: 'Boom',
      retryable: true,
    });
  });

  it.each([
    ['AUTHENTICATION_ERROR', 'authentication'],
    ['AUTH_INVALID', 'authentication'],
    ['VALIDATION_ERROR', 'validation'],
    ['CONFLICT_ERROR', 'conflict'],
    ['SERVER_ERROR', 'server'],
    ['SERVICE_UNAVAILABLE_ERROR', 'server'],
    ['RATE_LIMITED', 'server'],
    ['NETWORK_ERROR', 'network'],
    ['TIMEOUT', 'network'],
  ])('classifies the %s api error as kind %s', async (code, kind) => {
    const factory = await loadFactory();

    expect(factory.fromUiError(UI_ERROR, new ApiError({ code, message: code }))).toMatchObject({
      kind,
    });
  });

  it('keeps the http status of the originating api error', async () => {
    const factory = await loadFactory();
    const cause = new ApiError({ code: 'RATE_LIMITED', message: 'slow down', status: 429 });

    expect(factory.fromUiError(UI_ERROR, cause)).toEqual({
      kind: 'server',
      displayMessage: 'Boom',
      retryable: true,
      status: 429,
    });
  });

  it('classifies an unauthorized response by its parsed http code and status', async () => {
    const factory = await loadFactory();

    expect(factory.fromUiError(UI_ERROR, new Response(null, { status: 401 }))).toMatchObject({
      kind: 'authentication',
      status: 401,
    });
  });

  it('falls back to unknown for an error the parser cannot classify', async () => {
    const factory = await loadFactory();

    expect(factory.fromUiError(UI_ERROR, new Error('plain'))).toEqual({
      kind: 'unknown',
      displayMessage: 'Boom',
      retryable: true,
    });
  });

  it('omits the status when the originating error carries none', async () => {
    const factory = await loadFactory();
    const cause = new ApiError({ code: 'SERVER_ERROR', message: 'x' });
    const built = factory.fromUiError(UI_ERROR, cause);

    expect(Object.hasOwn(built, 'status')).toBe(false);
  });
});
