import RegistrationResponseMapper from '@/modules/User/store/registration-response-mapper';

describe('RegistrationResponseMapper', () => {
  const mapper = new RegistrationResponseMapper();

  it('maps a valid registration response', () => {
    const result = mapper.map({
      email: 'user@example.com',
      fullName: 'Test User',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        email: 'user@example.com',
        fullName: 'Test User',
      },
    });
  });

  it('returns a UI error when the registration response shape is invalid', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = mapper.map({
      email: 42,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid registration response to fail');
    }

    expect(result.error).toEqual({
      displayMessage: 'There was a problem with the provided information. Please check your input.',
      retryable: false,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
