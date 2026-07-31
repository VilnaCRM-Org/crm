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

    this.values = Object.freeze(result.data);
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
}

const appConfig = new AppConfig();

export default appConfig;
