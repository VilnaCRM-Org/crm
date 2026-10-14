import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AbortableAttempt,
  AbortableInput,
  AbortableRun,
  AbortableSubmit,
} from '@/hooks/types/use-abortable-submit';

async function runOnce<TInput, TOutcome>(
  attempt: AbortableAttempt<TInput, TOutcome>
): Promise<TOutcome | null> {
  const { inFlight, setSubmitting } = attempt;
  const controller = new AbortController();
  inFlight.current = controller;
  setSubmitting(true);
  try {
    const outcome = await attempt.run(attempt.input, controller.signal);
    return controller.signal.aborted ? null : outcome;
  } finally {
    inFlight.current = null;
    setSubmitting(false);
  }
}

export default function useAbortableSubmit<TInput, TOutcome>(
  run: AbortableRun<TInput, TOutcome>
): AbortableSubmit<TInput, TOutcome> {
  const [isSubmitting, setSubmitting] = useState(false);
  const inFlight = useRef<AbortController | null>(null);
  const lastInput = useRef<AbortableInput<TInput> | null>(null);
  useEffect(
    () => (): void => inFlight.current?.abort(),
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  const submit = useCallback(
    (input: TInput): Promise<TOutcome | null> => {
      if (inFlight.current) return Promise.resolve(null);
      lastInput.current = { value: input };
      return runOnce({ run, input, inFlight, setSubmitting });
    },
    [run]
  );
  const retry = useCallback(
    (): Promise<TOutcome | null> =>
      lastInput.current ? submit(lastInput.current.value) : Promise.resolve(null),
    [submit]
  );

  return {
    isSubmitting,
    submit,
    retry,
    forget: (): void => {
      lastInput.current = null;
    },
  };
}
