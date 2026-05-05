import {
  validateLoginResponse,
  validateRegistrationResponse,
} from '@/modules/User/features/Auth/types/api-responses';

describe('auth api response validators', () => {
  it('rejects array-like registration payloads with an object-level error', () => {
    expect(validateRegistrationResponse([])).toEqual({
      success: false,
      errors: ['value: expected object'],
    });
  });

  it('keeps valid login payloads intact', () => {
    expect(validateLoginResponse({ token: 'secret-token' })).toEqual({
      success: true,
      data: { token: 'secret-token' },
    });
  });
});
