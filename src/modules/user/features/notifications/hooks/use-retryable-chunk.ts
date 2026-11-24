import {
  type ComponentType,
  lazy,
  type LazyExoticComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  NotificationChunkModule,
  RetryableChunkLoad,
  RetryableChunkOptions,
} from '../types/components';

function useChunkLoad<TProps>({
  loader,
  onChunkFailure,
}: RetryableChunkOptions<TProps>): RetryableChunkLoad<TProps> {
  const failed = useRef(false);
  const load = useCallback(
    (): Promise<NotificationChunkModule<TProps>> =>
      loader.load((source, error) => {
        failed.current = true;
        onChunkFailure(source, error);
      }),
    [loader, onChunkFailure]
  );

  return { failed, load };
}

export default function useRetryableChunk<TProps>(
  options: RetryableChunkOptions<TProps>
): LazyExoticComponent<ComponentType<TProps>> {
  const { attempt } = options;
  const { failed, load } = useChunkLoad(options);
  const [Chunk, setChunk] = useState(() => lazy(load));

  useEffect(() => {
    if (!failed.current) return;
    failed.current = false;
    setChunk(lazy(load));
  }, [attempt, failed, load]);

  return Chunk;
}
