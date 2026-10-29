import { useId } from 'react';
import type { FormEvent } from 'react';

import type { SubmitBlock, SubmitBlockOptions } from '@/components/types/ui-form';

function refuseSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

export default function useSubmitBlock({
  reason = '',
  nativelyDisabled,
  noticeId,
  onSubmit,
}: SubmitBlockOptions): SubmitBlock {
  const reasonId = useId();
  const blocked = reason !== '' && !nativelyDisabled;

  return {
    blocked,
    reason,
    reasonId,
    describedBy: blocked ? `${noticeId} ${reasonId}` : noticeId,
    onSubmit: blocked || nativelyDisabled ? refuseSubmit : onSubmit,
  };
}
