import type { MutableRefObject } from 'react';

export type AbortableRun<TInput, TOutcome> = (
  input: TInput,
  signal: AbortSignal
) => Promise<TOutcome>;

export interface AbortableSubmit<TInput, TOutcome> {
  readonly isSubmitting: boolean;
  submit(input: TInput): Promise<TOutcome | null>;
  retry(): Promise<TOutcome | null>;
  forget(): void;
}

export interface AbortableInput<TInput> {
  readonly value: TInput;
}

export interface AbortableAttempt<TInput, TOutcome> {
  readonly run: AbortableRun<TInput, TOutcome>;
  readonly input: TInput;
  readonly inFlight: MutableRefObject<AbortController | null>;
  readonly setSubmitting: (submitting: boolean) => void;
}
