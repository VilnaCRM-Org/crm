import type { ComponentType } from 'react';

import type { ProtectedOutletContext } from './protected-outlet-context';

export type ShellChunkSource = 'app-shell:load' | 'app-shell:user-menu' | 'app-shell:current-user';

export type ShellChunkFailureHandler = (source: ShellChunkSource, error: unknown) => void;

export type ShellFailureHandler = (error: unknown) => void;

export interface ShellSlotProps extends ProtectedOutletContext {
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export interface ShellSlotModule {
  readonly default: ComponentType<ShellSlotProps>;
}

export type ShellSlotLoad = () => Promise<ShellSlotModule>;

export interface RouteModuleShell {
  readonly userMenu?: ShellSlotLoad | undefined;
}

export type UserMenuSlot = ComponentType<ProtectedOutletContext>;
