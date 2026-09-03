import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import localeFormatterCore from './locale-formatter-core';
import LocaleFormatterService from './locale-formatter-service';
import LOCALE_FORMATTER_TOKENS from './tokens';

class LocaleFormatterRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(
      LOCALE_FORMATTER_TOKENS.LocaleFormatterService,
      LocaleFormatterService
    );
    this.registerRenderPathSingletons(container);
  }

  // The formatter core stays a container-free module singleton so `src/i18n.js` can bind the
  // i18next language source at module load without pulling tsyringe onto the paint path (issue
  // #155). Registering that existing instance as a value is what lets the injectable service
  // receive it instead of value-importing it at the call site (issue #130).
  private registerRenderPathSingletons(container: DependencyContainer): void {
    container.register(LOCALE_FORMATTER_TOKENS.LocaleFormatterCore, {
      useValue: localeFormatterCore,
    });
  }
}

export default new LocaleFormatterRegistrar();
