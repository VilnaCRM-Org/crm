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

const SENSITIVE_KEY_SUBSTRINGS = ['token', 'secret', 'pass', 'auth'] as const;
const SENSITIVE_KEY_PATTERN = /(^|[-_])(api|x-?api|access|private|client)?key$/;

const isSensitiveKey = (k: string): boolean => {
  const lower = k.toLowerCase();
  if (SENSITIVE_KEYS_LOWER.has(lower)) return true;
  if (SENSITIVE_KEY_SUBSTRINGS.some((s) => lower.includes(s))) return true;
  return SENSITIVE_KEY_PATTERN.test(lower);
};
function deepRedact<T>(input: T, seen = new WeakSet<object>()): T {
  if (!input || typeof input !== 'object') return input;
  if (seen.has(input)) return '[Circular]' as unknown as T;

  if (input instanceof Map) {
    seen.add(input);
    return new Map(
      Array.from(input.entries(), ([k, v]) => [k, deepRedact(v, seen)])
    ) as unknown as T;
  }
  if (input instanceof Set) {
    seen.add(input);
    return new Set(Array.from(input.values(), (v) => deepRedact(v, seen))) as unknown as T;
  }
  if (Array.isArray(input)) {
    seen.add(input);
    return input.map((value) => deepRedact(value, seen)) as unknown as T;
  }
  if (!isPlainObject(input)) return input as T;
  seen.add(input);
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([k, v]) => [
      k,
      isSensitiveKey(k) ? '***' : deepRedact(v, seen),
    ])
  ) as T;
}

const REDACTABLE_META_KEYS = ['arg', 'headers', 'request'] as const;

function redactActionMeta(meta: Record<string, unknown> | undefined): {
  meta: Record<string, unknown> | undefined;
  changed: boolean;
} {
  if (!meta || typeof meta !== 'object') {
    return { meta, changed: false };
  }
  const next: Record<string, unknown> = { ...meta };
  let changed = false;
  for (const key of REDACTABLE_META_KEYS) {
    const value = next[key];
    if (value && typeof value === 'object') {
      next[key] = deepRedact(value);
      changed = true;
    }
  }
  return { meta: changed ? next : meta, changed };
}

const devToolsOptions: DevToolsEnhancerOptions = {
  actionSanitizer: <A extends AnyAction>(action: A): A => {
    const { meta: nextMeta, changed } = redactActionMeta(
      action.meta as Record<string, unknown> | undefined
    );
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
