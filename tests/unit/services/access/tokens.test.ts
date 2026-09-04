import ACCESS_TOKENS from '@/services/access/tokens';

type TokenName = keyof typeof ACCESS_TOKENS;

const TOKEN_NAMES: readonly TokenName[] = [
  'PermissionService',
  'PolicyEvaluator',
  'TenantContextService',
  'AccessFeatureFlagService',
  'AuditLogger',
  'SessionRepository',
  'AccessSessionService',
  'AccessCore',
  'AccessSession',
  'AuditCore',
  'PermissionResolver',
  'SessionFactory',
];

describe('ACCESS_TOKENS', () => {
  // The audit sink is installed container-free through auditCore.useSink, so it owns no
  // token: adding one back here would re-introduce a second, container-bound install path.
  it('declares exactly the twelve access tokens, in declaration order, and no audit sink', () => {
    expect(Object.keys(ACCESS_TOKENS)).toEqual([...TOKEN_NAMES]);
    expect(Object.keys(ACCESS_TOKENS)).toHaveLength(12);
    expect(Object.keys(ACCESS_TOKENS)).not.toContain('AuditSink');
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
    expect(ACCESS_TOKENS.SessionRepository).not.toBe(ACCESS_TOKENS.AuditLogger);
  });
});
