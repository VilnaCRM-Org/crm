import { renderHook } from '@testing-library/react';

import useResolvedErrorText from '@auth/components/form-section/auth-forms/use-resolved-error-text';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

const resolve = (errorText: string | undefined): string =>
  renderHook(() => useResolvedErrorText(errorText)).result.current;

const GENERIC_KEY = 'sign_up.errors.signup_error';
const FALLBACK_KEY = 'failure_responses.client_errors.something_went_wrong';

describe('useResolvedErrorText whitespace normalization', () => {
  it.each([
    { shape: 'single spaces', raw: 'invalid data provided' },
    { shape: 'repeated spaces', raw: 'invalid  data   provided' },
    { shape: 'a tab run', raw: 'invalid\t\tdata provided' },
    { shape: 'mixed newlines and spaces', raw: 'unprocessable \n  registration \t data' },
    { shape: 'surrounding padding and casing', raw: '  Invalid   Registration   Data  ' },
  ])('collapses $shape before matching the generic validation copy', ({ raw }) => {
    expect(resolve(raw)).toBe(GENERIC_KEY);
  });

  it('returns the raw text unchanged for a message that is not generic', () => {
    const raw = 'Email  already   registered';

    expect(resolve(raw)).toBe(raw);
  });

  it.each([
    { shape: 'undefined', raw: undefined },
    { shape: 'empty', raw: '' },
    { shape: 'whitespace only', raw: '  \t \n ' },
  ])('falls back to the generic client error for $shape input', ({ raw }) => {
    expect(resolve(raw)).toBe(FALLBACK_KEY);
  });
});
