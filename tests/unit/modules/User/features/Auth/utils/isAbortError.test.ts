import isAbortError from '@/modules/User/features/Auth/utils/isAbortError';

describe('isAbortError', () => {
  it('returns true for a DOMException', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
  });

  it('returns true for an Error with name === "AbortError"', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(isAbortError(err)).toBe(true);
  });

  it('returns true for an Error whose message contains "abort"', () => {
    expect(isAbortError(new Error('Request was aborted by user'))).toBe(true);
  });

  it('returns true for an Error whose message contains "cancel"', () => {
    expect(isAbortError(new Error('Cancelled by user'))).toBe(true);
  });

  it('returns false for a regular Error', () => {
    expect(isAbortError(new Error('Network error'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAbortError(null)).toBe(false);
  });

  it('returns false for a plain object without name', () => {
    expect(isAbortError({ message: 'Some error' })).toBe(false);
  });

  it('returns false for an Error with undefined message', () => {
    const err = new Error();
    err.message = undefined as unknown as string;
    expect(isAbortError(err)).toBe(false);
  });

  it('returns false for a DOMException with a non-abort type', () => {
    expect(isAbortError(new DOMException('Not allowed', 'SecurityError'))).toBe(false);
  });
});
