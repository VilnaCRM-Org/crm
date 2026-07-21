import { z } from 'zod';

import EnvSchema from './env-schema';
import rawEnv from './raw-env';
import type { Env } from './types/env';

class EnvConfig {
  private readonly values: Env;

  constructor() {
    const result = EnvSchema.safeParse(rawEnv.snapshot());
    if (!result.success) {
      throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
    }
    this.values = Object.freeze(result.data);
  }

  public get(): Env {
    return this.values;
  }

  public graphqlUrl(): string | undefined {
    return this.values.graphqlUrl;
  }

  public isProduction(): boolean {
    return this.values.nodeEnv === 'production';
  }
}

const env = new EnvConfig();

export default env;
