import { z } from 'zod';

import AppConfigSchema from './app-config-schema';
import appConfigSource from './app-config-source';
import type { AppConfigReader, AppConfigValues } from './types/app-config';

export class AppConfig implements AppConfigReader {
  private readonly values: AppConfigValues;

  constructor() {
    const result = AppConfigSchema.safeParse(appConfigSource.snapshot());

    if (!result.success) {
      throw new Error(`Invalid runtime configuration:\n${z.prettifyError(result.error)}`);
    }

    this.values = this.freeze(result.data);
  }

  public get(): AppConfigValues {
    return this.values;
  }

  public apiBaseUrl(): string | undefined {
    return this.values.apiBaseUrl;
  }

  public graphqlUrl(): string | undefined {
    return this.values.graphqlUrl;
  }

  // Object.freeze is shallow, so the nested flag object has to be frozen separately for `get()`
  // to actually honour the readonly contract its interface advertises.
  private freeze(values: AppConfigValues): AppConfigValues {
    const flags = values.flags === undefined ? {} : { flags: Object.freeze({ ...values.flags }) };

    return Object.freeze({ ...values, ...flags });
  }
}

const appConfig = new AppConfig();

export default appConfig;
