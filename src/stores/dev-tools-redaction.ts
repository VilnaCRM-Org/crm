import { injectable } from 'tsyringe';

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

const SENSITIVE_SUBSTRINGS = ['token', 'secret'];
const SENSITIVE_TOKEN_RE = /(^|[-_])(password|passwd|passcode|auth|authz|authn)($|[-_])/;
const KEY_SUFFIX_RE = /(^|[-_])(api|x-?api|access|private|client)?key$/;

@injectable()
export class DevToolsRedactor {
  public deepRedact<T>(
    input: T,
    seen: WeakSet<object> = new WeakSet(),
    cache: WeakMap<object, unknown> = new WeakMap()
  ): T {
    let redacted = input;

    if (typeof input === 'object' && input !== null) {
      const cached = cache.get(input);
      if (cached !== undefined) {
        redacted = cached as T;
      } else if (!seen.has(input)) {
        redacted = this.redactObjectInput<T>(input, seen, cache);
      }
    }

    return redacted;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') {
      return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS_LOWER.has(lowerKey)) {
      return true;
    }

    for (const substring of SENSITIVE_SUBSTRINGS) {
      if (lowerKey.includes(substring)) {
        return true;
      }
    }

    return SENSITIVE_TOKEN_RE.test(lowerKey) || KEY_SUFFIX_RE.test(lowerKey);
  }

  private redactMap<T>(
    input: Map<unknown, unknown>,
    seen: WeakSet<object>,
    cache: WeakMap<object, unknown>
  ): T {
    const output = new Map<unknown, unknown>();
    cache.set(input, output);

    for (const [key, value] of input.entries()) {
      const sensitiveKey = typeof key === 'string' && this.isSensitiveKey(key);
      const redactedKey = sensitiveKey ? '***' : key;
      output.set(redactedKey, this.deepRedact(value, seen, cache));
    }

    return output as unknown as T;
  }

  private redactSet<T>(
    input: Set<unknown>,
    seen: WeakSet<object>,
    cache: WeakMap<object, unknown>
  ): T {
    const output = new Set<unknown>();
    cache.set(input, output);

    for (const value of input.values()) {
      output.add(this.deepRedact(value, seen, cache));
    }

    return output as unknown as T;
  }

  private redactArray<T>(
    input: unknown[],
    seen: WeakSet<object>,
    cache: WeakMap<object, unknown>
  ): T {
    const output: unknown[] = [];
    cache.set(input, output);

    for (const value of input) {
      output.push(this.deepRedact(value, seen, cache));
    }

    return output as unknown as T;
  }

  private redactObject<T>(
    input: Record<string, unknown>,
    seen: WeakSet<object>,
    cache: WeakMap<object, unknown>
  ): T {
    const output: Record<string, unknown> = {};
    cache.set(input, output);

    for (const [key, value] of Object.entries(input)) {
      output[key] = this.isSensitiveKey(key) ? '***' : this.deepRedact(value, seen, cache);
    }

    return output as T;
  }

  private redactStructuredValue<T>(
    input: object,
    seen: WeakSet<object>,
    cache: WeakMap<object, unknown>
  ): T | undefined {
    let redacted: T | undefined;
    if (input instanceof Map) redacted = this.redactMap<T>(input, seen, cache);
    else if (input instanceof Set) redacted = this.redactSet<T>(input, seen, cache);
    else if (Array.isArray(input)) redacted = this.redactArray<T>(input, seen, cache);
    else if (this.isPlainObject(input)) redacted = this.redactObject<T>(input, seen, cache);
    return redacted;
  }

  private redactObjectInput<T>(
    input: object,
    seen: WeakSet<object>,
    cache: WeakMap<object, unknown>
  ): T {
    seen.add(input);
    const redacted = this.redactStructuredValue<T>(input, seen, cache) ?? (input as T);
    cache.set(input, redacted);
    return redacted;
  }
}

const defaultDevToolsRedactor = new DevToolsRedactor();

export default function deepRedact<T>(input: T): T {
  return defaultDevToolsRedactor.deepRedact(input);
}
