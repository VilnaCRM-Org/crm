import { useSyncExternalStore } from 'react';

import accessState from '@/lib/access/access-state';
import type { AccessSnapshot } from '@/lib/types/access/principal';

const subscribe = (onStoreChange: () => void): (() => void) => accessState.subscribe(onStoreChange);
const getSnapshot = (): AccessSnapshot => accessState.get();

export default function useAccessSnapshot(): AccessSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
