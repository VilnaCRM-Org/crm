import 'reflect-metadata';

import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import { buildRegistrationResponse } from '@tests/builders';
import { assertError, assertOk } from '@tests/utils/assert-result';

describe('RegistrationResponseMapper', () => {
  const mapper = new RegistrationResponseMapper();

  it('returns ok with user info on a valid response', () => {
    const response = buildRegistrationResponse();
    const result = mapper.map(response);

    assertOk(result);
    expect(result.value.fullName).toBe(response.fullName);
    expect(result.value.email).toBe(response.email);
  });

  it('returns error when response fields have wrong types', () => {
    const result = mapper.map({ fullName: 123, email: 456 });

    assertError(result);
    expect(result.error.displayMessage).toBeTruthy();
    expect(result.error.retryable).toBe(false);
  });

  it('returns error when the response is null', () => {
    const result = mapper.map(null);

    expect(result.ok).toBe(false);
  });
});
