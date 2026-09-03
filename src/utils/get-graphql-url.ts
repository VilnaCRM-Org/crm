import { inject, injectable } from 'tsyringe';

import { env } from '@/config/env';
import RUNTIME_TOKENS from '@/config/runtime/tokens';
import type { AppConfigReader } from '@/config/runtime/types/app-config';

@injectable()
export default class GraphQLUrl {
  private readonly fallback = 'http://localhost:4000/graphql';

  private readonly productionMessage =
    'A GraphQL URL must be defined in production environment. Set graphqlUrl in the runtime ' +
    'configuration (APP_CONFIG_GRAPHQL_URL) or REACT_APP_GRAPHQL_URL at build time. ' +
    'Cannot default to localhost.';

  constructor(@inject(RUNTIME_TOKENS.AppConfig) private readonly appConfig: AppConfigReader) {}

  public resolve(): string {
    // Runtime configuration wins over the build-time value so one image can be promoted across
    // environments without a rebuild (issue #145).
    const url = this.appConfig.graphqlUrl() ?? env.graphqlUrl();

    if (env.isProduction() && !url) {
      throw new Error(this.productionMessage);
    }

    return url || this.fallback;
  }
}
