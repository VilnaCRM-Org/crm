import { DevToolsEnhancerOptions, AnyAction } from '@reduxjs/toolkit';

const SENSITIVE_KEYS_LOWER = new Set([
  'password',
  'confirmpassword',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'apikey',
  'clientsecret',
  'secret',

  'authorization',
  'cookie',
  'set-cookie',
  'session',
]);

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
};

const isSensitiveKey = (k: string): boolean => {
  const lower = k.toLowerCase();
  return (
    SENSITIVE_KEYS_LOWER.has(lower) ||
    lower.includes('token') ||
    lower.endsWith('key') ||
    lower.includes('secret') ||
    lower.includes('pass')
  );
};
function deepRedact<T>(input: T): T {
  if (input == null) return input as T;
  if (Array.isArray(input)) return input.map(deepRedact) as unknown as T;
  if (!isPlainObject(input)) return input as T;
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([k, v]) => [
      k,
      isSensitiveKey(k) ? '***' : deepRedact(v),
    ])
  ) as T;
}

const devToolsOptions: DevToolsEnhancerOptions = {
  actionSanitizer: <A extends AnyAction>(action: A): A => {
    if (action.meta && typeof action.meta === 'object') {
      const m = action.meta as Record<string, unknown>;

      if (m.arg && typeof m.arg === 'object') m.arg = deepRedact(m.arg);
      if (m.headers && typeof m.headers === 'object') m.headers = deepRedact(m.headers);
      if (m.request && typeof m.request === 'object') m.request = deepRedact(m.request);
    }

    const aWithPayload = action as A & { payload?: unknown };
    if (aWithPayload.payload && typeof aWithPayload.payload === 'object') {
      aWithPayload.payload = deepRedact(aWithPayload.payload);
    }

    return action;
  },
  stateSanitizer: <S>(state: S): S => deepRedact(state) as S,
};

export default devToolsOptions;
