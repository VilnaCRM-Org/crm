import normalizeRegistrationData from '@/modules/user/features/auth/utils/normalize-registration-data';

describe('normalizeRegistrationData', () => {
  it('trims full name while preserving other fields', () => {
    const input = {
      fullName: '  Jane Doe  ',
      email: 'jane@example.com',
      password: 'Secret123',
    };

    expect(normalizeRegistrationData(input)).toEqual({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Secret123',
    });
  });
});
