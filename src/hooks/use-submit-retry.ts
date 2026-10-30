import { useRef } from 'react';

import type { SubmitRetry } from '@/hooks/types/use-submit-retry';

export default function useSubmitRetry(): SubmitRetry {
  const submitRef = useRef<HTMLButtonElement>(null);

  return { submitRef, retry: (): void => submitRef.current?.click() };
}
