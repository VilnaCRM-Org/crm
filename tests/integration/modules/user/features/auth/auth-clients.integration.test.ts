import '../../../../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import {
  ApiErrorFactory,
  ApiStatusErrorFactory,
  AuthClients,
  BaseAPI,
  LoginAPI,
  RegistrationAPI,
} from '@/modules/user/features/auth/repositories';
import { ApiErrorCodes } from '@/modules/user/types/api-errors';

describe('AuthClients composition root', () => {
  it('exposes the resolved LoginAPI and RegistrationAPI singletons', () => {
    const clients = container.resolve<AuthClients>(TOKENS.AuthClients);

    expect(clients.loginAPI).toBeInstanceOf(LoginAPI);
    expect(clients.registrationAPI).toBeInstanceOf(RegistrationAPI);
  });

  it('also exposes the supporting factories and base class through the barrel', () => {
    expect(typeof BaseAPI).toBe('function');
    expect(typeof ApiErrorFactory).toBe('function');
    expect(typeof ApiStatusErrorFactory).toBe('function');
  });

  it('keeps the AuthClients singleton stable across resolutions', () => {
    const first = container.resolve<AuthClients>(TOKENS.AuthClients);
    const second = container.resolve<AuthClients>(TOKENS.AuthClients);

    expect(first).toBe(second);
  });

  it('maps status-less HttpError-like values with network keywords to NETWORK', () => {
    const apiError = ApiErrorFactory.fromHttpError(
      { status: undefined as unknown as number, message: 'network unreachable' },
      'Login'
    );

    expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
    expect(apiError.message).toBe('Network error. Please check your connection.');
  });

  it('preserves the defensive exhaustive branch in ApiStatusErrorFactory', () => {
    const FactoryCtor = ApiStatusErrorFactory as unknown as new (
      spec: { kind: 'service' },
      error: { status: number; message: string },
      context: string
    ) => object;
    const factory = new FactoryCtor({ kind: 'service' }, { status: 503, message: '' }, 'Login');
    const toSimpleApiError = Reflect.get(factory, 'toSimpleApiError') as (
      kind: 'unexpected'
    ) => unknown;

    expect(toSimpleApiError.call(factory, 'unexpected')).toBe('unexpected');
  });
});
