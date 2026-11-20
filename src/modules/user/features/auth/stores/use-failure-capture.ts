import { useState } from 'react';

import observabilityCore from '@/services/observability/observability-core';
import type { FailureCapture } from '@auth/types/failure-capture';

export default function useFailureCapture(source: string): FailureCapture {
  const [capture] = useState<FailureCapture>(() => (error: unknown): void => {
    observabilityCore.captureError(error, { source });
  });
  return capture;
}
