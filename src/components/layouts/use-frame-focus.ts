import type { RefCallback } from 'react';

import useArrivalFocus from '@/hooks/use-arrival-focus';

export default function useFrameFocus(): RefCallback<HTMLElement> | null {
  return useArrivalFocus();
}
