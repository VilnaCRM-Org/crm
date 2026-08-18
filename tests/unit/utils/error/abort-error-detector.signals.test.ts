import AbortErrorDetector from '@/utils/error/abort-error-detector';

const NEUTRAL_MESSAGE = 'Request ended early';

const errorWith = (message: string, extras: Record<string, unknown>): Error =>
  Object.assign(new Error(message), extras);

describe('AbortErrorDetector — independent abort signals', () => {
  const detector = new AbortErrorDetector();

  it('detects the AbortError name on its own, without abort wording in the message', () => {
    const error = errorWith(NEUTRAL_MESSAGE, { name: 'AbortError' });

    expect(detector.isAbortError(error)).toBe(true);
  });

  it('detects the ABORT_ERR code on its own, without abort wording in the message', () => {
    const error = errorWith(NEUTRAL_MESSAGE, { code: 'ABORT_ERR' });

    expect(detector.isAbortError(error)).toBe(true);
  });

  it('detects the AbortError name even when the code names a different failure', () => {
    const error = errorWith(NEUTRAL_MESSAGE, { name: 'AbortError', code: 'ECONNRESET' });

    expect(detector.isAbortError(error)).toBe(true);
  });

  it('does not treat a blank error name as an abort signal', () => {
    const error = errorWith(NEUTRAL_MESSAGE, { name: '' });

    expect(detector.isAbortError(error)).toBe(false);
  });

  it('does not treat a blank error code as an abort signal', () => {
    const error = errorWith(NEUTRAL_MESSAGE, { code: '' });

    expect(detector.isAbortError(error)).toBe(false);
  });

  it('does not treat an unrelated name and code as an abort signal', () => {
    const error = errorWith(NEUTRAL_MESSAGE, { name: 'TypeError', code: 'ECONNRESET' });

    expect(detector.isAbortError(error)).toBe(false);
  });
});
