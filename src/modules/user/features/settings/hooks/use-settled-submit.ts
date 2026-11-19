import useAbortableSubmit from '@/hooks/use-abortable-submit';

import type { SettledSubmit, SettledSubmitOptions } from '../types/hooks/two-factor-submit';

export default function useSettledSubmit<TInput>(
  options: SettledSubmitOptions<TInput>
): SettledSubmit<TInput> {
  const { run, plan, settle } = options;
  const { isSubmitting, submit } = useAbortableSubmit(run);

  const send = async (input: TInput): Promise<void> => {
    const outcome = await submit(input);
    if (outcome !== null) settle(outcome, plan);
  };

  return { isSubmitting, send };
}
