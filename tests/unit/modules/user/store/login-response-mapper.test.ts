import 'reflect-metadata';

import LoginResponseMapper from '@/modules/user/store/login-response-mapper';

describe('LoginResponseMapper', () => {
  const mapper = new LoginResponseMapper();

  it('returns ok with normalized email and token on a valid response', () => {
    const result = mapper.map({ token: 'abc123' }, 'USER@EXAMPLE.COM');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.token).toBe('abc123');
      expect(result.value.email).toBe('user@example.com');
    }
  });

  it('returns error when the response is missing the token field', () => {
    const result = mapper.map({ invalidField: 'value' }, 'user@example.com');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBeTruthy();
      expect(result.error.retryable).toBe(false);
    }
  });

  it('returns error when the response is null', () => {
    const result = mapper.map(null, 'user@example.com');

    expect(result.ok).toBe(false);
  });
});
