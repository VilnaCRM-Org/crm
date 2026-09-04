import ErrorParser from '@/utils/error/error-parser';

interface ResponseHolder {
  Response?: unknown;
}

describe('ErrorParser — Response availability guard', () => {
  const runtime = globalThis as ResponseHolder;
  const originalResponse = runtime.Response;

  afterEach(() => {
    runtime.Response = originalResponse;
  });

  it('parses a JavaScript error without touching Response when the runtime lacks it', () => {
    const parser = new ErrorParser();
    const error = new Error('Something unexpected happened');
    delete runtime.Response;

    expect(parser.parseHttpError(error)).toEqual({
      code: 'JS_ERROR',
      message: 'Something unexpected happened',
      original: error,
    });
  });

  it('reports plain values as unknown when the runtime lacks Response', () => {
    const parser = new ErrorParser();
    const value = { transport: 'none' };
    delete runtime.Response;

    expect(parser.parseHttpError(value)).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      original: value,
    });
  });

  it('still maps Response objects to an HTTP code when the runtime provides Response', () => {
    const parser = new ErrorParser();
    const response = new Response(null, { status: 404 });

    expect(parser.parseHttpError(response)).toEqual({
      code: 'HTTP_404',
      message: 'HTTP error 404',
      original: response,
    });
  });
});
