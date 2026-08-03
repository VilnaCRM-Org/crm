import 'reflect-metadata';

import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import { buildRegistrationResponse } from '@tests/builders';

describe('RegistrationResponseMapper', () => {
  const mapper = new RegistrationResponseMapper();

  it('returns ok with user info on a valid response', () => {
    const response = buildRegistrationResponse();
    const result = mapper.map(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fullName).toBe(response.fullName);
      expect(result.value.email).toBe(response.email);
    }
  });

  it('returns error when response fields have wrong types', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = mapper.map({ fullName: 123, email: 456 });

    expect(consoleError).toHaveBeenCalledWith('Registration response validation failed', {
      issueCount: 2,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.displayMessage).toBeTruthy();
      expect(result.error.retryable).toBe(false);
    }
  });

  it('returns error when the response is null', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = mapper.map(null);

    expect(consoleError).toHaveBeenCalledWith('Registration response validation failed', {
      issueCount: 1,
    });
    expect(result.ok).toBe(false);
  });
});
