import { createElement, lazy, Suspense, useState } from 'react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

import type {
  ShellChunkFailureHandler,
  ShellSlot,
  ShellSlotHostProps,
  ShellSlotLoad,
  ShellSlotModule,
  ShellSlotProps,
  ShellSlotSource,
} from './types/shell-slot';

export default class ShellSlotFactory {
  constructor(private readonly report: ShellChunkFailureHandler) {}

  public create(load: ShellSlotLoad, source: ShellSlotSource): ShellSlot {
    const loader = new ThemedChunkLoader<ShellSlotProps>(
      new ChunkRetryLoader<ShellSlotModule>(load),
      muiThemeShellLoader
    );
    const { report } = this;

    function EmptySlot(): null {
      return null;
    }

    const loadSlot = (): Promise<ShellSlotModule> =>
      loader.load().catch((error: unknown) => {
        report(source, error);

        return { default: EmptySlot };
      });

    return function BoundShellSlot({ layout, signOut, onAvatar }: ShellSlotHostProps) {
      const [Slot] = useState(() => lazy(loadSlot));

      return createElement(
        Suspense,
        { fallback: createElement('span', { 'aria-hidden': 'true' }) },
        createElement(Slot, { layout, signOut, onAvatar, onChunkFailure: report })
      );
    };
  }
}
