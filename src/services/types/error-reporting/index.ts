export interface ErrorReporter {
  report(error: Error, context?: Record<string, unknown>): void;
}
