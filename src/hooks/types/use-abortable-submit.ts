import type { MutableRefObject } from 'react';

export type AbortableRun<TInput, TOutcome> = (
  input: TInput,
  signal: AbortSignal
) => Promise<TOutcome>;

export interface AbortableSubmit<TInput, TOutcome> {
  readonly isSubmitting: boolean;
  submit(input: TInput): Promise<TOutcome | null>;
}

export interface AbortableAttempt<TInput, TOutcome> {
  readonly run: AbortableRun<TInput, TOutcome>;
  readonly input: TInput;
  readonly inFlight: MutableRefObject<AbortController | null>;
  readonly setSubmitting: (submitting: boolean) => void;
}
