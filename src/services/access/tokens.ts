const ACCESS_TOKENS = Object.freeze({
  PermissionService: Symbol('PermissionService'),
  PolicyEvaluator: Symbol('PolicyEvaluator'),
  TenantContextService: Symbol('TenantContextService'),
  AccessFeatureFlagService: Symbol('AccessFeatureFlagService'),
  AuditLogger: Symbol('AuditLogger'),
  SessionRepository: Symbol('SessionRepository'),
  AccessSessionService: Symbol('AccessSessionService'),
} as const);

export default ACCESS_TOKENS;
