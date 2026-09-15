const ERROR_REPORTING_TOKENS = Object.freeze({
  ErrorReporter: Symbol('ErrorReporter'),
  BoundaryErrorReporter: Symbol('BoundaryErrorReporter'),
} as const);

export default ERROR_REPORTING_TOKENS;
