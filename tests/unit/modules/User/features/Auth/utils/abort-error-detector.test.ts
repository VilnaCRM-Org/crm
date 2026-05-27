import AbortErrorDetector from '@auth/utils/abort-error-detector';

describe('AbortErrorDetector', () => {
  const detector = new AbortErrorDetector();

  it('returns false for non-Error values', () => {
    expect(detector.isAbortError(undefined)).toBe(false);
    expect(detector.isAbortError(null)).toBe(false);
    expect(detector.isAbortError('string')).toBe(false);
    expect(detector.isAbortError(42)).toBe(false);
    expect(detector.isAbortError({ name: 'AbortError' })).toBe(false);
  });

  it('returns true for AbortError name', () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    expect(detector.isAbortError(error)).toBe(true);
  });

  it('returns true for ABORT_ERR code', () => {
    const error = Object.assign(new Error('Aborted'), { code: 'ABORT_ERR' });
    expect(detector.isAbortError(error)).toBe(true);
  });

  it('returns true for messages containing "abort"', () => {
    expect(detector.isAbortError(new Error('The request was aborted'))).toBe(true);
  });

  it('returns true for messages containing "cancel"', () => {
    expect(detector.isAbortError(new Error('Operation cancelled by user'))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(detector.isAbortError(new Error('Server unavailable'))).toBe(false);
  });

  it('handles Error instances without a message safely', () => {
    const error = new Error();
    error.message = undefined as unknown as string;
    expect(detector.isAbortError(error)).toBe(false);
  });
});
