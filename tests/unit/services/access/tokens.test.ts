import ACCESS_TOKENS from '@/services/access/tokens';

type TokenName = keyof typeof ACCESS_TOKENS;

const TOKEN_NAMES: readonly TokenName[] = [
  'PermissionService',
  'PolicyEvaluator',
  'TenantContextService',
  'FeatureFlagService',
  'AuditLogger',
  'AuditSink',
  'SessionRepository',
  'AccessSessionService',
];

describe('ACCESS_TOKENS', () => {
  it('declares exactly the eight access tokens, in declaration order', () => {
    expect(Object.keys(ACCESS_TOKENS)).toEqual([...TOKEN_NAMES]);
    expect(Object.keys(ACCESS_TOKENS)).toHaveLength(8);
  });

  it.each([...TOKEN_NAMES])('%s is a local symbol described by its key', (name) => {
    const token = ACCESS_TOKENS[name];

    expect(typeof token).toBe('symbol');
    expect(token.description).toBe(name);
    expect(Symbol.keyFor(token)).toBeUndefined();
  });

  it('gives every token a distinct symbol identity', () => {
    const tokens = Object.values(ACCESS_TOKENS);

    expect(new Set(tokens).size).toBe(tokens.length);
    expect(new Set(tokens).size).toBe(TOKEN_NAMES.length);
  });

  it('is frozen so a consumer cannot swap a token at runtime', () => {
    expect(Object.isFrozen(ACCESS_TOKENS)).toBe(true);
  });

  it('keeps the same symbol across repeated reads', () => {
    expect(ACCESS_TOKENS.PermissionService).toBe(ACCESS_TOKENS.PermissionService);
    expect(ACCESS_TOKENS.AuditSink).not.toBe(ACCESS_TOKENS.AuditLogger);
  });
});
