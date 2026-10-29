import '../../setup';
import container from '@/config/dependency-injection-config';
import type AbortErrorDetector from '@/utils/error/abort-error-detector';
import ERROR_UTILS_TOKENS from '@/utils/error/tokens';

const named = (name: string): Error => Object.assign(new Error('failed'), { name });

const coded = (code: string): Error => Object.assign(new Error('failed'), { code });

const messageless = (): Error => Object.assign(new Error(), { message: undefined });

describe('AbortErrorDetector through the container (integration)', () => {
  const detector = container.resolve<AbortErrorDetector>(ERROR_UTILS_TOKENS.AbortErrorDetector);

  it('resolves one singleton', () => {
    expect(container.resolve(ERROR_UTILS_TOKENS.AbortErrorDetector)).toBe(detector);
  });

  it.each([
    ['an AbortError name', named('AbortError')],
    ['an ABORT_ERR code', coded('ABORT_ERR')],
    ['an abort message', new Error('The request was Aborted')],
    ['a cancel message', new Error('Request CANCELLED by the user')],
  ])('recognises an Error with %s', (_name, error) => {
    expect(detector.isAbortError(error)).toBe(true);
  });

  it.each([
    ['a plain Error', new Error('Network down')],
    ['an Error with another code', coded('ECONNRESET')],
    ['an Error without a message', messageless()],
    ['a string', 'aborted'],
    ['an abort-shaped object', { name: 'AbortError', message: 'aborted' }],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_name, value) => {
    expect(detector.isAbortError(value)).toBe(false);
  });
});
