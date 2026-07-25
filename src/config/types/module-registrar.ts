import type { DependencyContainer } from 'tsyringe';

export interface ModuleRegistrar {
  register(container: DependencyContainer): void;
}
