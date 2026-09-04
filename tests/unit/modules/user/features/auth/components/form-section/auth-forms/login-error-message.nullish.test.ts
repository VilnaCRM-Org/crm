import { UNKNOWN_KEY } from '@auth/components/form-section/auth-forms/login-error-message';

const normalizeLoginError = async (error: unknown): Promise<string> => {
  const { default: Normalizer } =
    await import('@auth/components/form-section/auth-forms/login-error-message');

  return new Normalizer().normalize(error);
};

describe('LoginErrorMessageNormalizer nullish and non-object inputs', () => {
  it('falls back to the unknown key for undefined without reading its fields', async () => {
    await expect(normalizeLoginError(undefined)).resolves.toBe(UNKNOWN_KEY);
  });

  it('falls back to the unknown key for null without reading its fields', async () => {
    await expect(normalizeLoginError(null)).resolves.toBe(UNKNOWN_KEY);
  });

  it.each([
    ['a boolean', true],
    ['a number', 500],
    ['a symbol', Symbol('boom')],
  ])('falls back to the unknown key for %s', async (_label, error) => {
    await expect(normalizeLoginError(error)).resolves.toBe(UNKNOWN_KEY);
  });

  it('ignores a message carried by a non-object value', async () => {
    const callableError = Object.assign((): void => undefined, { message: 'callable message' });

    await expect(normalizeLoginError(callableError)).resolves.toBe(UNKNOWN_KEY);
  });
});

describe('LoginErrorMessageNormalizer whitespace handling', () => {
  it('trims a message reached through the serialized error field', async () => {
    await expect(normalizeLoginError({ message: '  Invalid credentials  ' })).resolves.toBe(
      'Invalid credentials'
    );
  });

  it('trims a message reached through a nested data field', async () => {
    await expect(
      normalizeLoginError({ data: { message: '\tInvalid credentials\n' } })
    ).resolves.toBe('Invalid credentials');
  });

  it('trims a message reached through a nested displayMessage string', async () => {
    await expect(normalizeLoginError({ displayMessage: '  Display message  ' })).resolves.toBe(
      'Display message'
    );
  });

  it('skips a whitespace-only message and keeps looking for a real one', async () => {
    await expect(
      normalizeLoginError({ message: '   ', displayMessage: '  Display message  ' })
    ).resolves.toBe('Display message');
  });
});
