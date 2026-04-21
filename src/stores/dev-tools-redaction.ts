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

const SENSITIVE_SUBSTRINGS = ['token', 'secret', 'pass', 'auth'];
const KEY_SUFFIX_RE = /(^|[-_])(api|x-?api|access|private|client)?key$/;

function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

function isSensitiveKey(k: string): boolean {
  const lower = k.toLowerCase();
  if (SENSITIVE_KEYS_LOWER.has(lower)) return true;
  for (const substring of SENSITIVE_SUBSTRINGS) {
    if (lower.includes(substring)) return true;
  }
  return KEY_SUFFIX_RE.test(lower);
}

function redactMap<T>(
  input: Map<unknown, unknown>,
  seen: WeakSet<object>,
  cache: WeakMap<object, unknown>
): T {
  const output = new Map<unknown, unknown>();
  cache.set(input, output);
  for (const [key, value] of input.entries()) {
    output.set(key, deepRedact(value, seen, cache));
  }
  return output as unknown as T;
}

function redactSet<T>(
  input: Set<unknown>,
  seen: WeakSet<object>,
  cache: WeakMap<object, unknown>
): T {
  const output = new Set<unknown>();
  cache.set(input, output);
  for (const value of input.values()) {
    output.add(deepRedact(value, seen, cache));
  }
  return output as unknown as T;
}

function redactArray<T>(
  input: unknown[],
  seen: WeakSet<object>,
  cache: WeakMap<object, unknown>
): T {
  const output: unknown[] = [];
  cache.set(input, output);
  for (const value of input) {
    output.push(deepRedact(value, seen, cache));
  }
  return output as unknown as T;
}

function redactObject<T>(
  input: Record<string, unknown>,
  seen: WeakSet<object>,
  cache: WeakMap<object, unknown>
): T {
  const output: Record<string, unknown> = {};
  cache.set(input, output);
  for (const [key, value] of Object.entries(input)) {
    output[key] = isSensitiveKey(key) ? '***' : deepRedact(value, seen, cache);
  }
  return output as T;
}

function redactStructuredValue<T>(
  input: object,
  seen: WeakSet<object>,
  cache: WeakMap<object, unknown>
): T | undefined {
  let redacted: T | undefined;
  if (input instanceof Map) redacted = redactMap<T>(input, seen, cache);
  else if (input instanceof Set) redacted = redactSet<T>(input, seen, cache);
  else if (Array.isArray(input)) redacted = redactArray<T>(input, seen, cache);
  else if (isPlainObject(input)) redacted = redactObject<T>(input, seen, cache);
  return redacted;
}

function redactObjectInput<T>(
  input: object,
  seen: WeakSet<object>,
  cache: WeakMap<object, unknown>
): T {
  seen.add(input);
  const redacted = redactStructuredValue<T>(input, seen, cache) ?? (input as T);
  cache.set(input, redacted);
  return redacted;
}

export default function deepRedact<T>(
  input: T,
  seen: WeakSet<object> = new WeakSet(),
  cache: WeakMap<object, unknown> = new WeakMap()
): T {
  let redacted = input;
  if (typeof input === 'object' && input !== null) {
    const cached = cache.get(input);
    if (cached !== undefined) redacted = cached as T;
    else if (!seen.has(input)) redacted = redactObjectInput<T>(input, seen, cache);
  }
  return redacted;
}
