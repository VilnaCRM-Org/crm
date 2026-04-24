import deepRedact from '@/stores/dev-tools-redaction';

describe('deepRedact', () => {
  it('redacts sensitive fields inside circular objects without overflowing', () => {
    const state: Record<string, unknown> = {
      token: 'secret-token',
      nested: { password: 'hidden-password' },
    };
    state.self = state;

    const redacted = deepRedact(state);

    expect(redacted.token).toBe('***');
    expect((redacted.nested as Record<string, unknown>).password).toBe('***');
    expect(redacted.self).toBe(redacted);
  });

  it('handles circular values inside arrays, maps, and sets', () => {
    const shared: Record<string, unknown> = { authToken: 'top-secret' };
    const input = {
      list: [shared],
      map: new Map([['item', shared]]),
      set: new Set([shared]),
    };
    shared.self = input;

    const redacted = deepRedact(input);
    const mapped = redacted.map.get('item') as Record<string, unknown>;
    const listed = redacted.list[0] as Record<string, unknown>;
    const [setValue] = Array.from(redacted.set.values()) as Record<string, unknown>[];

    expect(mapped.authToken).toBe('***');
    expect(listed.authToken).toBe('***');
    expect(setValue.authToken).toBe('***');
  });

  it('redacts sensitive values stored under sensitive map keys', () => {
    const redacted = deepRedact(
      new Map<unknown, unknown>([
        ['password', 'hidden-password'],
        ['profile', { token: 'secret-token' }],
      ])
    );

    expect(redacted.get('password')).toBe('***');
    expect(redacted.get('profile')).toEqual({ token: '***' });
  });
});
