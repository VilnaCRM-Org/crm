import { useSyncExternalStore } from 'react';

import type { ReactiveVar } from './types/reactive-var';

export default function useReactiveVar<TValue, TSlice>(
  variable: ReactiveVar<TValue>,
  select: (value: TValue) => TSlice
): TSlice {
  return useSyncExternalStore(variable.subscribe, () => select(variable()));
}
