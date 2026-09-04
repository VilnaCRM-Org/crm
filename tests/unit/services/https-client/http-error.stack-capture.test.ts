import { HttpError } from '@/services/https-client/http-error';

describe('HttpError stack capture', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('trims the constructor frames off the stack through captureStackTrace', () => {
    const captureStackTrace = jest.spyOn(Error, 'captureStackTrace');

    const error = new HttpError({ status: 503, message: 'service unavailable' });

    expect(captureStackTrace).toHaveBeenCalledTimes(1);
    expect(captureStackTrace).toHaveBeenCalledWith(error, HttpError);
  });

  it('hands captureStackTrace the concrete subclass constructor', () => {
    class GatewayTimeoutError extends HttpError {}
    const captureStackTrace = jest.spyOn(Error, 'captureStackTrace');

    const error = new GatewayTimeoutError({ status: 504, message: 'gateway timeout' });

    expect(captureStackTrace).toHaveBeenCalledWith(error, GatewayTimeoutError);
  });

  it('leaves no HttpError constructor frame on top of the stack', () => {
    const error = new HttpError({ status: 500, message: 'boom' });

    const [, topFrame] = (error.stack ?? '').split('\n');

    expect(topFrame).toBeDefined();
    expect(topFrame).not.toContain('new HttpError');
    expect(topFrame).not.toContain('http-error.ts');
  });

  it('still exposes a stack that names the error', () => {
    const error = new HttpError({ status: 500, message: 'boom' });

    expect(error.stack).toContain('HttpError: boom');
  });
});
