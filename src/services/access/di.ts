import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import AccessSessionService from './access-session-service';
import AuditLogger from './audit-logger';
import FeatureFlagService from './feature-flag-service';
import PermissionService from './permission-service';
import PolicyEvaluator from './policy-evaluator';
import SessionRepository from './session-repository';
import TenantContextService from './tenant-context-service';
import ACCESS_TOKENS from './tokens';

class AccessRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    this.registerAudit(container);
    this.registerPolicy(container);
    this.registerSession(container);
  }

  private registerAudit(container: DependencyContainer): void {
    container.registerSingleton(ACCESS_TOKENS.AuditLogger, AuditLogger);
  }

  private registerPolicy(container: DependencyContainer): void {
    container.registerSingleton(ACCESS_TOKENS.PermissionService, PermissionService);
    container.registerSingleton(ACCESS_TOKENS.PolicyEvaluator, PolicyEvaluator);
    container.registerSingleton(ACCESS_TOKENS.TenantContextService, TenantContextService);
    container.registerSingleton(ACCESS_TOKENS.FeatureFlagService, FeatureFlagService);
  }

  private registerSession(container: DependencyContainer): void {
    container.registerSingleton(ACCESS_TOKENS.SessionRepository, SessionRepository);
    container.registerSingleton(ACCESS_TOKENS.AccessSessionService, AccessSessionService);
  }
}

export default new AccessRegistrar();
