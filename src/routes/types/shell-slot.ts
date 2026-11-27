import type { ComponentType, ReactNode } from 'react';

import type { SignOutContext } from './protected-outlet-context';

export type ShellChunkSource =
  | 'app-shell:load'
  | 'app-shell:user-menu'
  | 'app-shell:current-user'
  | 'app-shell:notifications'
  | 'app-shell:notifications-history'
  | 'app-shell:notifications-list'
  | 'app-shell:notifications-mark-read'
  | 'app-shell:notifications-notice'
  | 'app-shell:notifications-record';

export type ShellChunkFailureHandler = (source: ShellChunkSource, error: unknown) => void;

export type ShellFailureHandler = (error: unknown) => void;

export type ShellAvatarHandler = (avatar: ReactNode) => void;

export type ShellSlotLayout = 'mobile' | 'tablet' | 'desktop';

export type ShellSlotSource = 'app-shell:user-menu' | 'app-shell:notifications';

export type ShellSlotKey = 'userMenu' | 'notifications';

export interface ShellSlotHostProps extends SignOutContext {
  readonly layout: ShellSlotLayout;
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
  readonly notifications?: ShellSlotLoad | undefined;
}

export type ShellSlot = ComponentType<ShellSlotHostProps>;
