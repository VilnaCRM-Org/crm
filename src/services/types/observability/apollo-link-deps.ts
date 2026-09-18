import type DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import type { CorrelationIdProvider } from '@/services/observability/correlation-id-provider';
import type { SessionCorrelation } from '@/services/observability/session-correlation';

import type { ObservabilityService } from './observability';

export interface ApolloLinkDeps {
  readonly observability: ObservabilityService;
  readonly correlationIds: CorrelationIdProvider;
  readonly sessionCorrelation: SessionCorrelation;
  readonly deadlineFetch: DeadlineFetchAdapter;
}
