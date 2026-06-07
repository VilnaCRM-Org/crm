import AuthErrorFactory from '@auth/repositories/auth-error-factory';

describe('AuthErrorFactory', () => {
  const factory = new AuthErrorFactory();

  it('maps a UiError to an unknown-kind AuthError', () => {
    expect(factory.fromUiError({ displayMessage: 'Boom', retryable: true })).toEqual({
      kind: 'unknown',
      displayMessage: 'Boom',
      retryable: true,
    });
  });
});
