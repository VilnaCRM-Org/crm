import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import type AuthErrorHandler from '@auth/utils/auth-error-handler';

describe('AuthUiErrorMapper', () => {
  it('maps API errors to a UI-safe auth error', () => {
    const mapper = container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper);
    const error = new Error('Connection failed');
    const uiError = mapper.map(error);

    expect(uiError.displayMessage).toBeTruthy();
    expect(typeof uiError.retryable).toBe('boolean');
  });

  it('resolves from the DI container with the registered AuthErrorHandler', () => {
    const defaultMapper = container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper);

    expect(defaultMapper.map(new Error('Network error')).displayMessage).toBeTruthy();
  });

  it('delegates to the injected AuthErrorHandler', () => {
    const authErrorHandler = {
      handle: jest.fn().mockReturnValue({ displayMessage: 'Unauthorized', retryable: false }),
    } as unknown as AuthErrorHandler;
    const injectedMapper = new AuthUiErrorMapper(authErrorHandler);

    expect(injectedMapper.map(new Error('ignored'))).toEqual({
      displayMessage: 'Unauthorized',
      retryable: false,
    });
    expect(authErrorHandler.handle).toHaveBeenCalledWith(expect.any(Error));
  });
});
