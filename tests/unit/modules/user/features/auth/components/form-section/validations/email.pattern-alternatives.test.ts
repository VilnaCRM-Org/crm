import loadIsolated from '@tests/unit/utils/isolated-module';

type EmailValidator = (typeof import('@auth/components/form-section/validations/email'))['default'];

/**
 * `VALID_EMAIL_RE` is composed from two module-level literals at import time, so a suite that
 * imports the module at file scope evaluates them before any test runs. Loading through a fresh
 * registry inside each test body is what puts the composed pattern under the assertion.
 */
const loadEmailValidator = (): Promise<EmailValidator> =>
  loadIsolated(
    async () => (await import('@auth/components/form-section/validations/email')).default
  );

describe('email pattern single-character alternatives', () => {
  it('accepts a single-character local part', async () => {
    const emailValidator = await loadEmailValidator();

    expect(emailValidator.isValidFormat('a@example.com')).toBe(true);
  });

  it('accepts a single-character domain label', async () => {
    const emailValidator = await loadEmailValidator();

    expect(emailValidator.isValidFormat('user@b.co')).toBe(true);
  });

  it('accepts a single character on both sides of the @', async () => {
    const emailValidator = await loadEmailValidator();

    expect(emailValidator.isValidFormat('a@b.co')).toBe(true);
  });

  it('accepts a single digit on both sides, not just a letter', async () => {
    const emailValidator = await loadEmailValidator();

    expect(emailValidator.isValidFormat('1@2.co')).toBe(true);
  });

  it('still rejects a one-character local part that is not alphanumeric', async () => {
    const emailValidator = await loadEmailValidator();

    expect(emailValidator.isValidFormat('-@example.com')).toBe(false);
  });

  it('still rejects a one-character domain label that is not alphanumeric', async () => {
    const emailValidator = await loadEmailValidator();

    expect(emailValidator.isValidFormat('user@-.co')).toBe(false);
  });
});
