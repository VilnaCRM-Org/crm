import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import ErrorParser from '@/utils/error/error-parser';

describe('AuthUiErrorMapper', () => {
  it('parses errors through the injected parser and maps to a UI error (direct construction)', () => {
    const mapper = new AuthUiErrorMapper(new ErrorParser());
    expect(mapper.map(new Error('Boom'))).toEqual(
      expect.objectContaining({ displayMessage: expect.any(String) })
    );
  });

  it('maps unknown shapes via the parser fallback (direct construction)', () => {
    const mapper = new AuthUiErrorMapper(new ErrorParser());
    expect(mapper.map({ status: 500 })).toEqual(
      expect.objectContaining({ displayMessage: expect.any(String) })
    );
  });

  it('resolves through the DI container and works end-to-end', () => {
    const resolved = container.resolve(AuthUiErrorMapper);
    expect(resolved.map(new Error('Boom'))).toEqual(
      expect.objectContaining({ displayMessage: expect.any(String) })
    );
  });
});
