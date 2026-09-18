import type RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import type HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import type HttpResponseProcessor from '@/services/https-client/http-response-processor';
import type RequestRetryService from '@/services/resilience/request-retry-service';

export interface HttpsClientDeps {
  readonly requestConfigBuilder: HttpRequestConfigBuilder;
  readonly responseProcessor: HttpResponseProcessor;
  readonly deadlines: RequestDeadlineFactory;
  readonly retries: RequestRetryService;
}
