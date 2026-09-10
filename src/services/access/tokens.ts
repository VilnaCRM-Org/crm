const ACCESS_TOKENS = Object.freeze({
  MutationAccessService: Symbol('MutationAccessService'),
  TenantContextService: Symbol('TenantContextService'),
  AccessFeatureFlagService: Symbol('AccessFeatureFlagService'),
  AuditLogger: Symbol('AuditLogger'),
  SessionRepository: Symbol('SessionRepository'),
  AccessSessionService: Symbol('AccessSessionService'),
  AccessCore: Symbol('AccessCore'),
  AccessSession: Symbol('AccessSession'),
  AuditCore: Symbol('AuditCore'),
  MutationAccessDispatcher: Symbol('MutationAccessDispatcher'),
  SessionFactory: Symbol('SessionFactory'),
} as const);

export default ACCESS_TOKENS;
