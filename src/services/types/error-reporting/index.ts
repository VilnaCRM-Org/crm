import type { CaptureContext } from '@/services/types/observability/observability';

export interface ErrorReporter {
  report(error: Error, context?: CaptureContext): void;
}
