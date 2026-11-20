import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import { GraphQLSocialSignInRepository } from '@auth/repositories';
import authSessionProvider from '@auth/stores/auth-session-provider';
import { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { AuthStateWriter } from '@auth/types/auth-store';
import type { SocialSignInDeps } from '@auth/types/social-sign-in/social-sign-in-deps';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

// The social sign-in bindings (specs/social-sign-in). The user module's composition root calls
// this registrar, so it still owns every binding of the module; they live in the auth feature
// because the root file is at its rust-code-analysis volume budget (config/metrics-policy.json).
class SocialSignInRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.SocialSignInRepository, GraphQLSocialSignInRepository);
    container.registerSingleton(AUTH_TOKENS.SocialSignInTransformer, SocialSignInTransformer);
    container.registerSingleton(AUTH_TOKENS.SocialSignInProvider, SocialSignInProvider);
    container.register<SocialSignInDeps>(AUTH_TOKENS.SocialSignInDeps, {
      useFactory: (c) => ({
        authState: c.resolve<AuthStateWriter>(AUTH_TOKENS.AuthStore),
        securitySignals: c.resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals),
        session: authSessionProvider,
        signedOut: CLEARED_AUTH_STATE,
      }),
    });
  }
}

const socialSignInRegistrar = new SocialSignInRegistrar();

export default socialSignInRegistrar;
