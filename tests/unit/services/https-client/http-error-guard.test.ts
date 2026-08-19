import { HttpError } from '@/services/https-client/http-error';
import HttpErrorGuard from '@/services/https-client/http-error-guard';

class GatewayTimeoutError extends HttpError {
  constructor() {
    super({ status: 504, message: 'gateway timeout' });
    this.name = 'GatewayTimeoutError';
  }
}

describe('HttpErrorGuard', () => {
  const guard = new HttpErrorGuard();

  it('recognises a plain HttpError instance', () => {
    expect(guard.is(new HttpError({ status: 500, message: 'boom' }))).toBe(true);
  });

  it('recognises an HttpError subclass that renamed itself', () => {
    const error = new GatewayTimeoutError();

    expect(error.name).toBe('GatewayTimeoutError');
    expect(guard.is(error)).toBe(true);
  });

  it('recognises a structurally shaped HttpError that crossed a serialization boundary', () => {
    expect(guard.is({ name: 'HttpError', status: 502, message: 'bad gateway' })).toBe(true);
  });

  it('rejects a plain Error', () => {
    expect(guard.is(new Error('boom'))).toBe(false);
  });

  it('rejects an HttpError-named object without a numeric status', () => {
    expect(guard.is({ name: 'HttpError', status: '500' })).toBe(false);
  });

  it('rejects null', () => {
    expect(guard.is(null)).toBe(false);
  });

  it('rejects a bare string', () => {
    expect(guard.is('HttpError')).toBe(false);
  });
});
