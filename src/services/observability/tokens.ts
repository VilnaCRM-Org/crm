const OBSERVABILITY_TOKENS = Object.freeze({
  ObservabilityService: Symbol('ObservabilityService'),
  ApolloLinkFactory: Symbol('ApolloLinkFactory'),
  ApolloLinkFactoryDeps: Symbol('ApolloLinkFactoryDeps'),
  ObservabilityCore: Symbol('ObservabilityCore'),
  CorrelationIdProvider: Symbol('CorrelationIdProvider'),
  SessionCorrelation: Symbol('SessionCorrelation'),
} as const);

export default OBSERVABILITY_TOKENS;
