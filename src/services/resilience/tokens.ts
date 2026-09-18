const RESILIENCE_TOKENS = Object.freeze({
  BackoffStrategy: Symbol('BackoffStrategy'),
  TransientErrorDetector: Symbol('TransientErrorDetector'),
  RequestRetryService: Symbol('RequestRetryService'),
} as const);

export default RESILIENCE_TOKENS;
