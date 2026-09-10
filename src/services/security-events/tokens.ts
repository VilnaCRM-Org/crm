const SECURITY_EVENT_TOKENS = Object.freeze({
  SecurityEventReporter: Symbol('SecurityEventReporter'),
  SecurityEventCore: Symbol('SecurityEventCore'),
} as const);

export default SECURITY_EVENT_TOKENS;
