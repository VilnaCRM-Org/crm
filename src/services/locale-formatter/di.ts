import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import LocaleFormatterService from './locale-formatter-service';
import LOCALE_FORMATTER_TOKENS from './tokens';

class LocaleFormatterRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(
      LOCALE_FORMATTER_TOKENS.LocaleFormatterService,
      LocaleFormatterService
    );
  }
}

export default new LocaleFormatterRegistrar();
