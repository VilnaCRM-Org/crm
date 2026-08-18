import 'reflect-metadata';
import { ApolloLink, Observable, execute, gql } from '@apollo/client';
import { container, type DependencyContainer } from 'tsyringe';

import errorRegistrar from '@/services/error/di';
import { ErrorHandler } from '@/services/error/error-handler';
import ERROR_TOKENS from '@/services/error/tokens';
import errorReportingRegistrar from '@/services/error-reporting/di';
import NoopErrorReporter from '@/services/error-reporting/noop-error-reporter';
import ERROR_REPORTING_TOKENS from '@/services/error-reporting/tokens';
import httpClientRegistrar from '@/services/https-client/di';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import HttpClientFactory from '@/services/https-client/https-client-factory';
import HTTP_TOKENS from '@/services/https-client/tokens';
import ApolloLinkFactory from '@/services/observability/apollo-link-factory';
import observabilityRegistrar from '@/services/observability/di';
import ObservabilityService from '@/services/observability/observability-service';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import AbortErrorDetector from '@/utils/error/abort-error-detector';
import errorUtilsRegistrar from '@/utils/error/di';
import ErrorParser from '@/utils/error/error-parser';
import ERROR_UTILS_TOKENS from '@/utils/error/tokens';

function unboundContainer(tokens: readonly symbol[]): DependencyContainer {
  const child = container.createChildContainer();
  tokens.forEach((token) => expect(child.isRegistered(token)).toBe(false));

  return child;
}

const PROBE_QUERY = gql`
  query {
    field
  }
`;

describe('error utils composition root', () => {
  const tokens = [ERROR_UTILS_TOKENS.ErrorParser, ERROR_UTILS_TOKENS.AbortErrorDetector];

  it('binds the error parser and the abort detector into the container it is given', () => {
    const child = unboundContainer(tokens);

    errorUtilsRegistrar.register(child);

    expect(child.isRegistered(ERROR_UTILS_TOKENS.ErrorParser)).toBe(true);
    expect(child.isRegistered(ERROR_UTILS_TOKENS.AbortErrorDetector)).toBe(true);
  });

  it('binds each token to its own implementation as a singleton', () => {
    const child = unboundContainer(tokens);

    errorUtilsRegistrar.register(child);

    const parser = child.resolve(ERROR_UTILS_TOKENS.ErrorParser);
    const detector = child.resolve(ERROR_UTILS_TOKENS.AbortErrorDetector);
    expect(parser).toBeInstanceOf(ErrorParser);
    expect(detector).toBeInstanceOf(AbortErrorDetector);
    expect(child.resolve(ERROR_UTILS_TOKENS.ErrorParser)).toBe(parser);
  });
});

describe('error composition root', () => {
  const tokens = [ERROR_TOKENS.ErrorHandler];

  it('binds the error handler token to the ErrorHandler singleton', () => {
    const child = unboundContainer(tokens);

    errorRegistrar.register(child);

    expect(child.isRegistered(ERROR_TOKENS.ErrorHandler)).toBe(true);
    const handler = child.resolve(ERROR_TOKENS.ErrorHandler);
    expect(handler).toBeInstanceOf(ErrorHandler);
    expect(child.resolve(ERROR_TOKENS.ErrorHandler)).toBe(handler);
  });
});

describe('error reporting composition root', () => {
  const tokens = [ERROR_REPORTING_TOKENS.ErrorReporter];

  it('binds the error reporter token to the no-op reporter singleton', () => {
    const child = unboundContainer(tokens);

    errorReportingRegistrar.register(child);

    expect(child.isRegistered(ERROR_REPORTING_TOKENS.ErrorReporter)).toBe(true);
    const reporter = child.resolve(ERROR_REPORTING_TOKENS.ErrorReporter);
    expect(reporter).toBeInstanceOf(NoopErrorReporter);
    expect(child.resolve(ERROR_REPORTING_TOKENS.ErrorReporter)).toBe(reporter);
  });
});

describe('observability composition root', () => {
  const tokens = [
    OBSERVABILITY_TOKENS.ObservabilityService,
    OBSERVABILITY_TOKENS.ApolloLinkFactory,
  ];

  it('binds the observability service and the apollo link factory', () => {
    const child = unboundContainer(tokens);

    observabilityRegistrar.register(child);

    expect(child.isRegistered(OBSERVABILITY_TOKENS.ObservabilityService)).toBe(true);
    expect(child.isRegistered(OBSERVABILITY_TOKENS.ApolloLinkFactory)).toBe(true);
  });

  it('resolves an apollo link factory wired to the same observability singleton', async () => {
    const child = unboundContainer(tokens);

    observabilityRegistrar.register(child);

    const service = child.resolve<ObservabilityService>(OBSERVABILITY_TOKENS.ObservabilityService);
    const linkFactory = child.resolve<ApolloLinkFactory>(OBSERVABILITY_TOKENS.ApolloLinkFactory);
    expect(service).toBeInstanceOf(ObservabilityService);
    expect(linkFactory).toBeInstanceOf(ApolloLinkFactory);
    expect(child.resolve(OBSERVABILITY_TOKENS.ObservabilityService)).toBe(service);

    // Prove the binding rather than assume it: the factory's error link reports through whichever
    // service instance it was injected with, so spying on the resolved singleton catches a factory
    // that was handed a different one.
    const captureError = jest.spyOn(service, 'captureError').mockImplementation(() => undefined);
    const networkError = new Error('offline');
    const failing = new ApolloLink(
      () => new Observable((observer) => observer.error(networkError))
    );
    const errorLink = (linkFactory as unknown as { errorLink: () => ApolloLink }).errorLink();

    try {
      await new Promise<void>((resolve) => {
        execute(ApolloLink.from([errorLink, failing]), { query: PROBE_QUERY }).subscribe({
          error: () => resolve(),
          complete: () => resolve(),
        });
      });

      expect(captureError).toHaveBeenCalledWith(networkError, { source: 'apollo:network' });
    } finally {
      // clearMocks resets call history but not implementations, and restoreMocks is off, so a
      // failing assertion here would otherwise leave the singleton stubbed for the rest of the run.
      captureError.mockRestore();
    }
  });
});

describe('https client composition root', () => {
  const tokens = [
    HTTP_TOKENS.HttpErrorGuard,
    HTTP_TOKENS.HttpRequestConfigBuilder,
    HTTP_TOKENS.HttpErrorResponseParser,
    HTTP_TOKENS.HttpResponseProcessor,
    HTTP_TOKENS.HttpClientFactory,
    HTTP_TOKENS.HttpsClient,
  ];

  it('binds every http token the client graph needs', () => {
    const child = unboundContainer(tokens);

    httpClientRegistrar.register(child);

    tokens.forEach((token) => expect(child.isRegistered(token)).toBe(true));
  });

  it('binds each http token to its own implementation', () => {
    const child = unboundContainer(tokens);

    httpClientRegistrar.register(child);

    expect(child.resolve(HTTP_TOKENS.HttpErrorGuard)).toBeInstanceOf(HttpErrorGuard);
    expect(child.resolve(HTTP_TOKENS.HttpRequestConfigBuilder)).toBeInstanceOf(
      HttpRequestConfigBuilder
    );
    expect(child.resolve(HTTP_TOKENS.HttpErrorResponseParser)).toBeInstanceOf(
      HttpErrorResponseParser
    );
    expect(child.resolve(HTTP_TOKENS.HttpResponseProcessor)).toBeInstanceOf(HttpResponseProcessor);
    expect(child.resolve(HTTP_TOKENS.HttpClientFactory)).toBeInstanceOf(HttpClientFactory);
    expect(child.resolve(HTTP_TOKENS.HttpsClient)).toBeInstanceOf(FetchHttpsClient);
  });
});
