import type { RefCallback } from 'react';

import useArrivalFocus from '@/hooks/use-arrival-focus';

import styles from './app-layout.styles';
import useHeaderClearance from './use-header-clearance';

export default function useFrameFocus(): RefCallback<HTMLElement> | null {
  useHeaderClearance(styles.headerHeight);

  return useArrivalFocus();
}
