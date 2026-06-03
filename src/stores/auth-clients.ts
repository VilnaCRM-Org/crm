import type { DependencyContainer } from 'tsyringe';

import defaultContainer from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import { AuthClients } from '@auth/repositories';

export default function createAuthClients(
  dependencyContainer: DependencyContainer = defaultContainer
): AuthClients {
  return dependencyContainer.resolve<AuthClients>(TOKENS.AuthClients);
}
