import 'reflect-metadata';

import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import { buildEmail, buildToken } from '@tests/builders';
import { assertError, assertOk } from '@tests/utils/assert-result';

describe('LoginResponseMapper', () => {
  const mapper = new LoginResponseMapper();

  it('returns ok with normalized email and token on a valid response', () => {
    const token = buildToken();
    const result = mapper.map({ token }, 'USER@EXAMPLE.COM');

    assertOk(result);
    expect(result.value.token).toBe(token);
    expect(result.value.email).toBe('user@example.com');
  });

  it('returns error when the response is missing the token field', () => {
    const result = mapper.map({ invalidField: 'value' }, buildEmail());

    assertError(result);
    expect(result.error.displayMessage).toBeTruthy();
    expect(result.error.retryable).toBe(false);
  });

  it('returns error when the response is null', () => {
    const result = mapper.map(null, buildEmail());

    expect(result.ok).toBe(false);
  });
});
