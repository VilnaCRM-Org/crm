const OBSERVABILITY_TOKENS = Object.freeze({
  ObservabilityService: Symbol('ObservabilityService'),
  ApolloLinkFactory: Symbol('ApolloLinkFactory'),
  ObservabilityCore: Symbol('ObservabilityCore'),
  CorrelationIdProvider: Symbol('CorrelationIdProvider'),
} as const);

export default OBSERVABILITY_TOKENS;
