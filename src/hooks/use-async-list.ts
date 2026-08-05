import { useEffect, useRef, useState } from 'react';

import type { AsyncListApply, AsyncListState, AsyncListSubscription } from './types/use-async-list';

const INITIAL_STATE = { items: [], isLoading: true, hasError: false };

async function runLoad<T>(
  load: () => Promise<readonly T[]>,
  subscription: AsyncListSubscription,
  apply: AsyncListApply<T>
): Promise<void> {
  try {
    const items = await load();
    if (subscription.active) {
      apply({ items, isLoading: false, hasError: false });
    }
  } catch {
    if (subscription.active) {
      apply({ items: [], isLoading: false, hasError: true });
    }
  }
}

export default function useAsyncList<T>(load: () => Promise<readonly T[]>): AsyncListState<T> {
  const [state, setState] = useState<AsyncListState<T>>(INITIAL_STATE);
  const loadRef = useRef(load);

  useEffect(() => {
    const subscription: AsyncListSubscription = { active: true };

    void runLoad(loadRef.current, subscription, setState);

    return (): void => {
      subscription.active = false;
    };
  }, []);

  return state;
}
