import { createElement, lazy } from 'react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

import type { ProtectedOutletContext } from './types/protected-outlet-context';
import type {
  ShellChunkFailureHandler,
  ShellSlotLoad,
  ShellSlotModule,
  ShellSlotProps,
  UserMenuSlot,
} from './types/shell-slot';

export default class ShellSlotFactory {
  constructor(private readonly report: ShellChunkFailureHandler) {}

  public create(load: ShellSlotLoad): UserMenuSlot {
    const loader = new ThemedChunkLoader<ShellSlotProps>(
      new ChunkRetryLoader<ShellSlotModule>(load),
      muiThemeShellLoader
    );
    const { report } = this;

    function EmptySlot(): null {
      return null;
    }

    const Slot = lazy(() =>
      loader.load().catch((error: unknown) => {
        report('app-shell:user-menu', error);

        return { default: EmptySlot };
      })
    );

    return function BoundUserMenuSlot({ signOut }: ProtectedOutletContext) {
      return createElement(Slot, { signOut, onChunkFailure: report });
    };
  }
}
