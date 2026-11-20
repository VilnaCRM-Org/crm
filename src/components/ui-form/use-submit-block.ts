import { useId } from 'react';
import type { FormEvent } from 'react';

import type { SubmitBlock, SubmitBlockOptions } from '@/components/types/ui-form';

function refuseSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

function describedByOf(
  noticeId: string | undefined,
  reasonId: string | undefined
): string | undefined {
  if (reasonId === undefined) return noticeId;
  return noticeId === undefined ? reasonId : `${noticeId} ${reasonId}`;
}

export default function useSubmitBlock({
  reason = '',
  nativelyDisabled,
  held,
  noticeId,
  onSubmit,
}: SubmitBlockOptions): SubmitBlock {
  const reasonId = useId();
  const reasoned = reason !== '' && !nativelyDisabled;
  const blocked = reasoned || (held && !nativelyDisabled);

  return {
    blocked,
    reason: reasoned ? reason : '',
    reasonId,
    describedBy: describedByOf(noticeId, reasoned ? reasonId : undefined),
    onSubmit: blocked || nativelyDisabled ? refuseSubmit : onSubmit,
  };
}
