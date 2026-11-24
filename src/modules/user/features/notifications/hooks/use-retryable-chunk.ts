import {
  type ComponentType,
  lazy,
  type LazyExoticComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { NotificationChunkModule, RetryableChunkOptions } from '../types/components';

export default function useRetryableChunk<TProps>({
  loader,
  onChunkFailure,
  attempt,
}: RetryableChunkOptions<TProps>): LazyExoticComponent<ComponentType<TProps>> {
  const failed = useRef(false);
  const load = useCallback(
    (): Promise<NotificationChunkModule<TProps>> =>
      loader.load((source, error) => {
        failed.current = true;
        onChunkFailure(source, error);
      }),
    [loader, onChunkFailure]
  );
  const [Chunk, setChunk] = useState(() => lazy(load));

  useEffect(() => {
    if (!failed.current) return;
    failed.current = false;
    setChunk(lazy(load));
  }, [attempt, load]);

  return Chunk;
}
