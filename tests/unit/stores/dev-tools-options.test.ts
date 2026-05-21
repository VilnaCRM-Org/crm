import devToolsOptions from '@/stores/dev-tools-options';

const REDACTED = '***';

interface RedactedAuth {
  token?: string;
  user?: { email?: string; password?: string };
  data?: Map<string, string> | Set<string>;
}

type ActionWithMeta<P = unknown> = {
  type: string;
  payload?: P;
  meta?: Record<string, unknown>;
};

const callActionSanitizer = <A extends { type: string }>(action: A): A => {
  const sanitizer = devToolsOptions.actionSanitizer as (input: A) => A;
  return sanitizer(action);
};

const callStateSanitizer = <S>(state: S): S => {
  const sanitizer = devToolsOptions.stateSanitizer as (input: S) => S;
  return sanitizer(state);
};

describe('devToolsOptions.actionSanitizer', () => {
  it('redacts sensitive payload fields', () => {
    const action: ActionWithMeta<{ token: string; nested: { password: string } }> = {
      type: 'auth/login',
      payload: { token: 'secret', nested: { password: 'p' } },
    };

    const result = callActionSanitizer(action);

    expect(result.payload).toEqual({
      token: REDACTED,
      nested: { password: REDACTED },
    });
  });

  it('redacts sensitive meta fields under arg / headers / request', () => {
    const action: ActionWithMeta = {
      type: 'auth/login',
      meta: {
        arg: { password: 'p' },
        headers: { Authorization: 'Bearer abc' },
        request: { jwt: 'value' },
        other: { keep: 'me' },
      },
    };

    const result = callActionSanitizer(action);

    expect(result.meta).toMatchObject({
      arg: { password: REDACTED },
      headers: { Authorization: REDACTED },
      request: { jwt: REDACTED },
      other: { keep: 'me' },
    });
  });

  it('returns the same action reference when nothing needed redaction', () => {
    const action: ActionWithMeta<number> = {
      type: 'counter/increment',
      payload: 1,
      meta: { plain: 'value' },
    };

    expect(callActionSanitizer(action)).toBe(action);
  });

  it('handles primitive payloads without crashing', () => {
    const action: ActionWithMeta<number> = { type: 'tick', payload: 42 };
    expect(callActionSanitizer(action)).toBe(action);
  });

  it('handles missing meta gracefully', () => {
    const action: ActionWithMeta = { type: 'noop' };
    expect(callActionSanitizer(action)).toBe(action);
  });

  it('preserves circular references with a placeholder', () => {
    const circular: Record<string, unknown> = { token: 'abc' };
    circular.self = circular;
    const action: ActionWithMeta<Record<string, unknown>> = {
      type: 'auth/circular',
      payload: circular,
    };

    const result = callActionSanitizer(action) as ActionWithMeta<Record<string, unknown>>;

    expect(result.payload?.token).toBe(REDACTED);
    expect(result.payload?.self).toBe('[Circular]');
  });

  it('recurses into Map and Set payload values to redact nested sensitive fields', () => {
    const mapAction: ActionWithMeta<{ data: Map<string, { token: string }> }> = {
      type: 'auth/data-map',
      payload: {
        data: new Map<string, { token: string }>([['key', { token: 'abc' }]]),
      },
    };
    const sanitizedMap = callActionSanitizer(mapAction) as ActionWithMeta<{
      data: Map<string, { token: string }>;
    }>;
    expect(sanitizedMap.payload?.data.get('key')?.token).toBe(REDACTED);

    const setAction: ActionWithMeta<{ items: Set<{ token: string }> }> = {
      type: 'auth/data-set',
      payload: { items: new Set([{ token: 'abc' }]) },
    };
    const sanitizedSet = callActionSanitizer(setAction) as ActionWithMeta<{
      items: Set<{ token: string }>;
    }>;
    const [first] = Array.from(sanitizedSet.payload?.items ?? []);
    expect(first?.token).toBe(REDACTED);
  });

  it('redacts keys matched by substring or pattern (not direct set membership)', () => {
    const action: ActionWithMeta<Record<string, unknown>> = {
      type: 'auth/fuzzy',
      payload: {
        myToken: 'value',
        clientSecret: 'value',
        oldPassword: 'value',
        authConfig: 'value',
        apiKey: 'value',
        accessKey: 'value',
        someUnrelated: 'kept',
      },
    };

    const sanitized = callActionSanitizer(action) as ActionWithMeta<Record<string, unknown>>;

    expect(sanitized.payload).toEqual({
      myToken: REDACTED,
      clientSecret: REDACTED,
      oldPassword: REDACTED,
      authConfig: REDACTED,
      apiKey: REDACTED,
      accessKey: REDACTED,
      someUnrelated: 'kept',
    });
  });

  it('recurses into array payload values to redact nested sensitive fields', () => {
    const action: ActionWithMeta<{ items: Array<{ token: string }> }> = {
      type: 'auth/data-array',
      payload: { items: [{ token: 'abc' }, { token: 'def' }] },
    };
    const sanitized = callActionSanitizer(action) as ActionWithMeta<{
      items: Array<{ token: string }>;
    }>;
    expect(sanitized.payload?.items.map((item) => item.token)).toEqual([REDACTED, REDACTED]);
  });

  it('does not mutate plain class instances', () => {
    class Foo {
      public token = 'abc';
    }
    const instance = new Foo();
    const action: ActionWithMeta<Foo> = { type: 'auth/instance', payload: instance };

    const sanitized = callActionSanitizer(action);

    expect(sanitized.payload).toBe(instance);
    expect(instance.token).toBe('abc');
  });
});

describe('devToolsOptions.stateSanitizer', () => {
  it('returns state unchanged for primitives', () => {
    expect(callStateSanitizer(null)).toBeNull();
    expect(callStateSanitizer(undefined)).toBeUndefined();
    expect(callStateSanitizer(0)).toBe(0);
  });

  it('redacts sensitive fields in the auth slice', () => {
    const state = {
      auth: { token: 'abc', user: { email: 'a@b', password: 'p' } } as RedactedAuth,
      other: 1,
    };

    const sanitized = callStateSanitizer(state);

    expect(sanitized.auth).toEqual({
      token: REDACTED,
      user: { email: 'a@b', password: REDACTED },
    });
    expect(sanitized.other).toBe(1);
  });

  it('leaves auth as undefined when missing', () => {
    const state = { other: 'value' };
    const sanitized = callStateSanitizer(state);
    expect((sanitized as { auth?: unknown }).auth).toBeUndefined();
  });
});
