import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import type ErrorParser from '@/utils/error/error-parser';

describe('AuthUiErrorMapper', () => {
  it('maps API errors to a UI-safe auth error', () => {
    const mapper = container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper);
    const error = new Error('Connection failed');
    const uiError = mapper.map(error);

    expect(uiError.displayMessage).toBeTruthy();
    expect(typeof uiError.retryable).toBe('boolean');
  });

  it('uses the registered parser when resolved from the DI container', () => {
    const defaultMapper = container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper);

    expect(defaultMapper.map(new Error('Network error')).displayMessage).toBeTruthy();
  });

  it('loads when reflected parser constructor type is unavailable', () => {
    jest.isolateModules(() => {
      jest.doMock('@/utils/error/error-parser', () => ({ __esModule: true, default: undefined }));

      expect(require('@/modules/User/store/auth-ui-error-mapper')).toBeDefined();

      jest.dontMock('@/utils/error/error-parser');
    });
  });

  it('uses an injected parser instance when provided', () => {
    const parser = {
      parseHttpError: jest.fn().mockReturnValue({ code: 'HTTP_401', message: 'Unauthorized' }),
    } as unknown as ErrorParser;
    const injectedMapper = new AuthUiErrorMapper(parser);

    expect(injectedMapper.map(new Error('ignored'))).toEqual({
      displayMessage: 'Unauthorized',
      retryable: false,
    });
    expect(parser.parseHttpError).toHaveBeenCalledWith(expect.any(Error));
  });
});
