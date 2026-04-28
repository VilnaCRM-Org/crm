import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { DependencyContainer } from 'tsyringe';

import type LoginAPI from '@/modules/User/features/Auth/api/login-api';
import type RegistrationAPI from '@/modules/User/features/Auth/api/registration-api';
import type { ThunkExtra } from '@/modules/User/store/types';

export default function createAuthClients(
  dependencyContainer: DependencyContainer = container
): ThunkExtra {
  return {
    loginAPI: dependencyContainer.resolve<LoginAPI>(TOKENS.LoginAPI),
    registrationAPI: dependencyContainer.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
  };
}
