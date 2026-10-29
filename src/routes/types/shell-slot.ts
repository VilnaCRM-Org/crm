import type { ComponentType, ReactNode } from 'react';

import type { ProtectedOutletContext } from './protected-outlet-context';

export type ShellChunkSource = 'app-shell:load' | 'app-shell:user-menu' | 'app-shell:current-user';

export type ShellChunkFailureHandler = (source: ShellChunkSource, error: unknown) => void;

export type ShellFailureHandler = (error: unknown) => void;

export type ShellAvatarHandler = (avatar: ReactNode) => void;

export interface ShellSlotHostProps extends ProtectedOutletContext {
  readonly onAvatar: ShellAvatarHandler;
}

export interface ShellSlotProps extends ShellSlotHostProps {
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export interface ShellSlotModule {
  readonly default: ComponentType<ShellSlotProps>;
}

export type ShellSlotLoad = () => Promise<ShellSlotModule>;

export interface RouteModuleShell {
  readonly userMenu?: ShellSlotLoad | undefined;
}

export type UserMenuSlot = ComponentType<ShellSlotHostProps>;
