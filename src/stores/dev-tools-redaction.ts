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

function redactMap<T>(input: Map<unknown, unknown>): T {
  const output = new Map<unknown, unknown>();
  for (const [key, value] of input.entries()) {
    output.set(key, deepRedact(value));
  }
  return output as unknown as T;
}

function redactSet<T>(input: Set<unknown>): T {
  const output = new Set<unknown>();
  for (const value of input.values()) {
    output.add(deepRedact(value));
  }
  return output as unknown as T;
}

function redactArray<T>(input: unknown[]): T {
  const output: unknown[] = [];
  for (const value of input) {
    output.push(deepRedact(value));
  }
  return output as unknown as T;
}

function redactObject<T>(input: Record<string, unknown>): T {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = isSensitiveKey(key) ? '***' : deepRedact(value);
  }
  return output as T;
}

export default function deepRedact<T>(input: T): T {
  let redacted: T = input;
  if (input instanceof Map) redacted = redactMap<T>(input);
  else if (input instanceof Set) redacted = redactSet<T>(input);
  else if (Array.isArray(input)) redacted = redactArray<T>(input);
  else if (isPlainObject(input)) redacted = redactObject<T>(input);
  return redacted;
}
