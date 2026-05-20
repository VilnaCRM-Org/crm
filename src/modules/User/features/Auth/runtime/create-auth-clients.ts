import type { DependencyContainer } from 'tsyringe';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { ThunkExtra } from '@/modules/User/store/types';

import type LoginAPI from '../api/login-api';
import type RegistrationAPI from '../api/registration-api';

export default function createAuthClients(
  dependencyContainer: DependencyContainer = container
): ThunkExtra {
  return {
    loginAPI: dependencyContainer.resolve<LoginAPI>(TOKENS.LoginAPI),
    registrationAPI: dependencyContainer.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
  };
}
