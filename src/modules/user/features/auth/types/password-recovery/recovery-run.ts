import type { ModuleLoader } from '@/lib/reliability/types/module-loader';
import type AUTH_TOKENS from '@/modules/user/config/tokens';

export interface AuthTokensModule {
  readonly default: typeof AUTH_TOKENS;
}

export type AuthTokensLoader = ModuleLoader<AuthTokensModule>;
