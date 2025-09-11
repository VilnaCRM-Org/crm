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
  'auth',
  'jwt',
  'bearer',
  'cookie',
  'set-cookie',
  'x-auth-token',
  'csrf',
  'xsrf',
  'session',
]);

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
};

const isSensitiveKey = (k: string): boolean => {
  const lower = k.toLowerCase();
  if (SENSITIVE_KEYS_LOWER.has(lower)) return true;
  return (
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('pass') ||
    /(^|[-_])(api|x-?api|access|private|client)?key$/.test(lower) ||
    lower.includes('auth')
  );
};
function deepRedact<T>(input: T): T {
  if (input instanceof Map) {
    return new Map(Array.from(input.entries(), ([k, v]) => [k, deepRedact(v)])) as unknown as T;
  }
  if (input instanceof Set) {
    return new Set(Array.from(input.values(), (v) => deepRedact(v))) as unknown as T;
  }
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
    let changed = false;
    let nextMeta = action.meta as Record<string, unknown> | undefined;
    if (nextMeta && typeof nextMeta === 'object') {
      const m: Record<string, unknown> = { ...nextMeta };
      if (m.arg && typeof m.arg === 'object') {
        m.arg = deepRedact(m.arg);
        changed = true;
      }
      if (m.headers && typeof m.headers === 'object') {
        m.headers = deepRedact(m.headers);
        changed = true;
      }
      if (m.request && typeof m.request === 'object') {
        m.request = deepRedact(m.request);
        changed = true;
      }
      if (changed) nextMeta = m;
    }
    const ap = (action as A & { payload?: unknown }).payload;
    const nextPayload = ap && typeof ap === 'object' ? deepRedact(ap) : ap;
    const payloadChanged = nextPayload !== ap;
    return changed || payloadChanged
      ? ({ ...action, meta: nextMeta, payload: nextPayload } as A)
      : action;
  },
  stateSanitizer: <S>(state: S): S => {
    if (!state || typeof state !== 'object') return state;

    const stateObj = state as S & { auth?: unknown };
    return {
      ...stateObj,
      auth: stateObj.auth ? deepRedact(stateObj.auth) : undefined,
    };
  },
};

export default devToolsOptions;
