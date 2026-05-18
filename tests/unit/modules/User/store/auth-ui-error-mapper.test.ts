import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import type ErrorParser from '@/utils/error/error-parser';

describe('AuthUiErrorMapper', () => {
  const mapper = new AuthUiErrorMapper();

  it('maps API errors to a UI-safe auth error', () => {
    const error = new Error('Connection failed');
    const uiError = mapper.map(error);

    expect(uiError.displayMessage).toBeTruthy();
    expect(typeof uiError.retryable).toBe('boolean');
  });

  it('uses the default parser when no parser instance is injected', () => {
    const defaultMapper = new AuthUiErrorMapper(undefined);

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
