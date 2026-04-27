import '../setup';
import { DevToolsOptionsFactory } from '@/stores/dev-tools-options';
import { DevToolsRedactor } from '@/stores/dev-tools-redaction';

describe('DevToolsRedactor Integration', () => {
  let redactor: DevToolsRedactor;

  beforeEach(() => {
    redactor = new DevToolsRedactor();
  });

  describe('primitive passthrough', () => {
    it('returns strings unchanged', () => {
      expect(redactor.deepRedact('hello')).toBe('hello');
    });

    it('returns numbers unchanged', () => {
      expect(redactor.deepRedact(42)).toBe(42);
    });

    it('returns null unchanged', () => {
      expect(redactor.deepRedact(null)).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(redactor.deepRedact(undefined)).toBeUndefined();
    });

    it('returns booleans unchanged', () => {
      expect(redactor.deepRedact(true)).toBe(true);
    });
  });

  describe('plain object redaction', () => {
    it('redacts SENSITIVE_KEYS_LOWER exact match', () => {
      const result = redactor.deepRedact({ password: 'secret', name: 'alice' });
      expect(result.password).toBe('***');
      expect(result.name).toBe('alice');
    });

    it('redacts keys matching sensitive substring "token"', () => {
      const result = redactor.deepRedact({ mytoken: 'abc', safe: 1 });
      expect(result.mytoken).toBe('***');
    });

    it('redacts keys matching sensitive substring "secret"', () => {
      const result = redactor.deepRedact({ clientsecret: 'xyz' });
      expect(result.clientsecret).toBe('***');
    });

    it('redacts keys matching SENSITIVE_TOKEN_RE (auth segment)', () => {
      const result = redactor.deepRedact({ 'x-auth': 'bearer-token' });
      expect(result['x-auth']).toBe('***');
    });

    it('redacts keys matching KEY_SUFFIX_RE (apikey)', () => {
      const result = redactor.deepRedact({ apikey: '12345' });
      expect(result.apikey).toBe('***');
    });

    it('leaves non-sensitive keys untouched', () => {
      const result = redactor.deepRedact({ username: 'alice', age: 30 });
      expect(result.username).toBe('alice');
      expect(result.age).toBe(30);
    });

    it('recursively redacts nested objects', () => {
      const result = redactor.deepRedact({ user: { token: 'abc', name: 'bob' } });
      expect((result.user as Record<string, unknown>).token).toBe('***');
      expect((result.user as Record<string, unknown>).name).toBe('bob');
    });
  });

  describe('null-prototype object (isPlainObject prototype === null)', () => {
    it('treats Object.create(null) as a plain object and redacts it', () => {
      const obj = Object.create(null) as Record<string, unknown>;
      obj.password = 'secret';
      obj.foo = 'bar';
      const result = redactor.deepRedact(obj as Record<string, unknown>);
      expect((result as Record<string, unknown>).password).toBe('***');
      expect((result as Record<string, unknown>).foo).toBe('bar');
    });
  });

  describe('array redaction', () => {
    it('redacts sensitive values inside arrays', () => {
      const result = redactor.deepRedact([{ password: 'secret' }, { name: 'alice' }]);
      expect((result[0] as Record<string, unknown>).password).toBe('***');
      expect((result[1] as Record<string, unknown>).name).toBe('alice');
    });

    it('handles nested arrays', () => {
      const result = redactor.deepRedact([[{ token: 'abc' }]]);
      expect(((result[0] as unknown[])[0] as Record<string, unknown>).token).toBe('***');
    });
  });

  describe('Map redaction', () => {
    it('redacts sensitive map keys', () => {
      const map = new Map<string, unknown>([
        ['password', 'secret'],
        ['username', 'alice'],
      ]);
      const result = redactor.deepRedact(map);
      expect(result.get('password')).toBe('***');
      expect(result.get('username')).toBe('alice');
    });

    it('does not redact non-string map keys', () => {
      const map = new Map<unknown, unknown>([[1, 'value']]);
      const result = redactor.deepRedact(map);
      expect(result.get(1)).toBe('value');
    });

    it('recursively redacts map values', () => {
      const map = new Map<string, unknown>([['data', { token: 'abc' }]]);
      const result = redactor.deepRedact(map);
      expect((result.get('data') as Record<string, unknown>).token).toBe('***');
    });
  });

  describe('Set redaction', () => {
    it('recursively redacts values inside Sets', () => {
      const set = new Set<unknown>([{ password: 'secret' }, 'plain']);
      const result = redactor.deepRedact(set);
      const values = Array.from(result.values());
      expect((values[0] as Record<string, unknown>).password).toBe('***');
      expect(values[1]).toBe('plain');
    });
  });

  describe('class instance passthrough (not a plain object)', () => {
    it('returns class instances unchanged', () => {
      const date = new Date('2024-01-01');
      const result = redactor.deepRedact({ ts: date });
      expect((result as { ts: Date }).ts).toBe(date);
    });

    it('returns a bare class instance without redacting it', () => {
      class Foo {
        secret = 'not-redacted';
      }
      const foo = new Foo();
      const result = redactor.deepRedact(foo);
      expect(result).toBe(foo);
    });
  });

  describe('circular reference handling', () => {
    it('handles self-referencing objects via cache', () => {
      const obj: Record<string, unknown> = { token: 'secret' };
      obj.self = obj;
      const result = redactor.deepRedact(obj);
      expect(result.token).toBe('***');
      expect(result.self).toBe(result);
    });

    it('handles shared objects referenced from multiple places (cache hit)', () => {
      const shared: Record<string, unknown> = { password: 'secret' };
      const input = { a: shared, b: shared };
      const result = redactor.deepRedact(input);
      expect((result.a as Record<string, unknown>).password).toBe('***');
      expect(result.a).toBe(result.b);
    });

    it('handles circular references inside arrays, maps, and sets', () => {
      const shared: Record<string, unknown> = { authToken: 'top-secret' };
      const input = {
        list: [shared],
        map: new Map([['item', shared]]),
        set: new Set([shared]),
      };
      shared.self = input;

      const result = redactor.deepRedact(input);
      const mapped = result.map.get('item') as Record<string, unknown>;
      const listed = result.list[0] as Record<string, unknown>;
      const [setValue] = Array.from(result.set.values()) as Record<string, unknown>[];

      expect(mapped.authToken).toBe('***');
      expect(listed.authToken).toBe('***');
      expect(setValue.authToken).toBe('***');
    });
  });
});

describe('DevToolsOptionsFactory Integration', () => {
  let factory: DevToolsOptionsFactory;
  let options: ReturnType<DevToolsOptionsFactory['create']>;

  beforeEach(() => {
    const redactor = new DevToolsRedactor();
    factory = new DevToolsOptionsFactory(redactor);
    options = factory.create();
  });

  describe('actionSanitizer', () => {
    it('returns the original action when nothing is sensitive', () => {
      const action = { type: 'noop', payload: 'plain', meta: undefined };
      const result = options.actionSanitizer?.(action, 0);
      expect(result).toBe(action);
    });

    it('redacts sensitive payload object', () => {
      const action = { type: 'auth/login', payload: { token: 'abc' } };
      const result = options.actionSanitizer?.(action, 0);
      expect((result as typeof action).payload.token).toBe('***');
    });

    it('redacts sensitive meta.arg field', () => {
      const action = { type: 'auth/login', meta: { arg: { password: 'secret' } } };
      const result = options.actionSanitizer?.(action, 0);
      expect(
        ((result as typeof action).meta.arg as Record<string, unknown>).password
      ).toBe('***');
    });

    it('redacts sensitive meta.headers field', () => {
      const action = { type: 'auth/login', meta: { headers: { authorization: 'Bearer xyz' } } };
      const result = options.actionSanitizer?.(action, 0);
      expect(
        ((result as typeof action).meta.headers as Record<string, unknown>).authorization
      ).toBe('***');
    });

    it('redacts sensitive meta.request field', () => {
      const action = { type: 'auth/login', meta: { request: { apikey: 'key123' } } };
      const result = options.actionSanitizer?.(action, 0);
      expect(
        ((result as typeof action).meta.request as Record<string, unknown>).apikey
      ).toBe('***');
    });

    it('returns original action when meta is a non-object scalar', () => {
      const action = { type: 'noop', meta: { arg: 'plain', headers: 42, request: null } };
      expect(options.actionSanitizer?.(action, 0)).toBe(action);
    });

    it('returns original action when payload is non-object', () => {
      const action = { type: 'noop', payload: 42 };
      expect(options.actionSanitizer?.(action, 0)).toBe(action);
    });

    it('returns original action when meta is not an object', () => {
      const action = { type: 'noop', meta: null };
      expect(options.actionSanitizer?.(action, 0)).toBe(action);
    });
  });

  describe('stateSanitizer', () => {
    it('returns primitive state unchanged', () => {
      expect(options.stateSanitizer?.('idle', 0)).toBe('idle');
      expect(options.stateSanitizer?.(null, 0)).toBeNull();
    });

    it('leaves auth as undefined when absent', () => {
      const state = { ui: { loading: false } };
      const result = options.stateSanitizer?.(state, 0) as typeof state & { auth?: unknown };
      expect(result.auth).toBeUndefined();
    });

    it('redacts sensitive fields inside auth', () => {
      const state = { auth: { token: 'secret', email: 'user@test.com' } };
      const result = options.stateSanitizer?.(state, 0) as typeof state;
      expect(result.auth.token).toBe('***');
      expect(result.auth.email).toBe('user@test.com');
    });

    it('does not redact non-auth branches', () => {
      const state = { auth: { token: 'secret' }, ui: { theme: 'dark' } };
      const result = options.stateSanitizer?.(state, 0) as typeof state;
      expect(result.ui.theme).toBe('dark');
    });
  });
});
