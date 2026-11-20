import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import ProfileProvider, {
  TwoFactorSettingsProvider,
} from '@/modules/user/features/settings/data-providers';
import GraphQLProfileRepository, {
  GraphQLTwoFactorSettingsRepository,
} from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer, {
  GraphQLTwoFactorSettingsTransformer,
} from '@/modules/user/features/settings/transformers';

class UserSettingsRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.GraphQLProfileRepository, GraphQLProfileRepository);
    container.registerSingleton(AUTH_TOKENS.GraphQLProfileTransformer, GraphQLProfileTransformer);
    container.registerSingleton(AUTH_TOKENS.ProfileProvider, ProfileProvider);
    container.registerSingleton(
      AUTH_TOKENS.GraphQLTwoFactorSettingsRepository,
      GraphQLTwoFactorSettingsRepository
    );
    container.registerSingleton(
      AUTH_TOKENS.GraphQLTwoFactorSettingsTransformer,
      GraphQLTwoFactorSettingsTransformer
    );
    container.registerSingleton(AUTH_TOKENS.TwoFactorSettingsProvider, TwoFactorSettingsProvider);
  }
}

const userSettingsRegistrar = new UserSettingsRegistrar();

export default userSettingsRegistrar;
