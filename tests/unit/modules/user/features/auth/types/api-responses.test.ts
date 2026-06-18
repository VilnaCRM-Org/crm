import ResponseValidators from '@auth/types/response-validators';

const responseValidators = new ResponseValidators();

describe('auth api response validators', () => {
  it('rejects array-like registration payloads with an object-level error', () => {
    expect(responseValidators.validateRegistration([])).toEqual({
      success: false,
      errors: ['value: expected object'],
    });
  });

  it('keeps valid login payloads intact', () => {
    expect(responseValidators.validateLogin({ token: 'secret-token' })).toEqual({
      success: true,
      data: { token: 'secret-token' },
    });
  });
});
