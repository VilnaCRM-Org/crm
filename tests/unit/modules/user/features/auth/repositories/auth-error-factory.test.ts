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

  it('builds a validation AuthError that preserves issues', () => {
    const result = factory.fromValidationIssues('Invalid data provided', [
      { path: 'email', message: 'Invalid email' },
    ]);
    expect(result).toEqual({
      kind: 'validation',
      displayMessage: 'Invalid data provided',
      retryable: false,
      issues: [{ path: 'email', message: 'Invalid email' }],
    });
  });
});
