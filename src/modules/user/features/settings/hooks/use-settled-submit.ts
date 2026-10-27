import { useRef } from 'react';

import useAbortableSubmit from '@/hooks/use-abortable-submit';

import type {
  SentInput,
  SettledSubmit,
  SettledSubmitOptions,
} from '../types/hooks/two-factor-submit';

export default function useSettledSubmit<TInput>(
  options: SettledSubmitOptions<TInput>
): SettledSubmit<TInput> {
  const { run, plan, settle } = options;
  const last = useRef<SentInput<TInput> | null>(null);
  const { isSubmitting, submit } = useAbortableSubmit(run);

  const send = async (input: TInput): Promise<void> => {
    last.current = { input };
    const outcome = await submit(input);
    if (outcome !== null) settle(outcome, plan);
  };

  const resend = async (): Promise<void> => {
    if (last.current !== null) await send(last.current.input);
  };

  return { isSubmitting, send, resend };
}
