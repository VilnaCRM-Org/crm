import { useRef, useSyncExternalStore } from 'react';

import type { ReactiveVar, ReactiveVarSnapshot } from './types/reactive-var';

export default function useReactiveVar<TValue, TSlice>(
  variable: ReactiveVar<TValue>,
  select: (value: TValue) => TSlice
): TSlice {
  const snapshot = useRef<ReactiveVarSnapshot<TValue, TSlice> | null>(null);
  const getSnapshot = (): TSlice => {
    const value = variable();
    const cached = snapshot.current;
    if (cached !== null && Object.is(cached.value, value) && cached.select === select) {
      return cached.slice;
    }
    const slice = select(value);
    snapshot.current = { value, select, slice };
    return slice;
  };
  return useSyncExternalStore(variable.subscribe, getSnapshot);
}
