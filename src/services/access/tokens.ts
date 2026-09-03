const ACCESS_TOKENS = Object.freeze({
  PermissionService: Symbol('PermissionService'),
  PolicyEvaluator: Symbol('PolicyEvaluator'),
  TenantContextService: Symbol('TenantContextService'),
  AccessFeatureFlagService: Symbol('AccessFeatureFlagService'),
  AuditLogger: Symbol('AuditLogger'),
  SessionRepository: Symbol('SessionRepository'),
  AccessSessionService: Symbol('AccessSessionService'),
  AccessCore: Symbol('AccessCore'),
  AccessSession: Symbol('AccessSession'),
  AuditCore: Symbol('AuditCore'),
  PermissionResolver: Symbol('PermissionResolver'),
  SessionFactory: Symbol('SessionFactory'),
} as const);

export default ACCESS_TOKENS;
