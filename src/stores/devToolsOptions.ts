import { DevToolsEnhancerOptions, AnyAction } from '@reduxjs/toolkit';

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'apiKey',
  'clientSecret',
  'secret',
]);

function deepRedact<T>(input: T): T {
  if (input == null || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(deepRedact) as unknown as T;

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k) ? '***' : deepRedact(v),
    ])
  ) as T;
}

const devToolsOptions: DevToolsEnhancerOptions = {
  actionSanitizer: (action) => {
    const meta = (action as AnyAction).meta as unknown;
    if (meta && typeof meta === 'object' && 'arg' in meta) {
      const { arg } = meta as { arg?: unknown };
      if (arg && typeof arg === 'object' && Object.prototype.hasOwnProperty.call(arg, 'password')) {
        return {
          ...action,
          meta: {
            ...(meta as object),
            arg: { ...(arg as Record<string, unknown>), password: '***' },
          },
        };
      }
    }
    return action;
  },
  stateSanitizer: <S>(state: S): S => deepRedact(state) as S,
};

export default devToolsOptions;
