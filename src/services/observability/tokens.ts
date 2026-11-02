const OBSERVABILITY_TOKENS = Object.freeze({
  ObservabilityService: Symbol('ObservabilityService'),
  ApolloLinkFactory: Symbol('ApolloLinkFactory'),
  ApolloLinkFactoryDeps: Symbol('ApolloLinkFactoryDeps'),
  ObservabilityCore: Symbol('ObservabilityCore'),
  CorrelationIdProvider: Symbol('CorrelationIdProvider'),
  SessionCorrelation: Symbol('SessionCorrelation'),
  UnseenFailureReporter: Symbol('UnseenFailureReporter'),
} as const);

export default OBSERVABILITY_TOKENS;
