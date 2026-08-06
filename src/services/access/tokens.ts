const ACCESS_TOKENS = Object.freeze({
  PermissionService: Symbol('PermissionService'),
  PolicyEvaluator: Symbol('PolicyEvaluator'),
  TenantContextService: Symbol('TenantContextService'),
  FeatureFlagService: Symbol('FeatureFlagService'),
  AuditLogger: Symbol('AuditLogger'),
  AuditSink: Symbol('AuditSink'),
  SessionRepository: Symbol('SessionRepository'),
  AccessSessionService: Symbol('AccessSessionService'),
} as const);

export default ACCESS_TOKENS;
