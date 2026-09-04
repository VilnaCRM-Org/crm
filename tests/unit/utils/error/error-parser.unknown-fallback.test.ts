/**
 * The unknown-error code and message live in a module-level constant, so they are frozen the
 * moment the module is imported. Importing inside each test keeps that constant under test.
 */
describe('ErrorParser unknown fallback', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it.each([
    ['a plain object', { nothing: 'to see here' }],
    ['a string', 'a bare string'],
    ['a number', 404],
    ['null', null],
    ['undefined', undefined],
  ])('pins the unknown error code and message for %s', async (_label, original) => {
    const { default: ErrorParser } = await import('@/utils/error/error-parser');

    expect(new ErrorParser().parseHttpError(original)).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      original,
    });
  });

  it('keeps the unknown code and message non-empty', async () => {
    const { default: ErrorParser } = await import('@/utils/error/error-parser');
    const parsed = new ErrorParser().parseHttpError(Symbol('unmatched'));

    expect(parsed.code).toHaveLength('UNKNOWN_ERROR'.length);
    expect(parsed.message).toHaveLength('An unknown error occurred'.length);
  });
});
