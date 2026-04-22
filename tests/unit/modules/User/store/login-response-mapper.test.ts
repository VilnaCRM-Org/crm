import LoginResponseMapper from '@/modules/User/store/login-response-mapper';

describe('LoginResponseMapper', () => {
  const mapper = new LoginResponseMapper();

  it('maps a valid login response and normalizes the email', () => {
    const result = mapper.map({ token: 'abc123' }, 'USER@EXAMPLE.COM');

    expect(result).toEqual({
      ok: true,
      value: {
        email: 'user@example.com',
        token: 'abc123',
      },
    });
  });

  it('keeps the normalized email when the raw payload also contains email-like data', () => {
    const result = mapper.map(
      { token: 'abc123', email: 'SERVER@EXAMPLE.COM' },
      'USER@EXAMPLE.COM'
    );

    expect(result).toEqual({
      ok: true,
      value: {
        email: 'user@example.com',
        token: 'abc123',
      },
    });
  });

  it('returns a UI error when the login response shape is invalid', () => {
    const result = mapper.map({ token: 123 }, 'user@example.com');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid login response to fail');
    }

    expect(result.error).toEqual({
      displayMessage: 'Unexpected response from server',
      retryable: false,
    });
  });
});
