import type { ComponentType } from 'react';

import type { AppLayoutProps } from '@/components/types/layouts/app-layout';

import type { ShellChunkFailureHandler, ShellSlotLoad, UserMenuSlot } from './shell-slot';

export interface UserMenuSlotFactory {
  create(load: ShellSlotLoad): UserMenuSlot;
}

export type UserMenuSlotFactoryClass = new (
  report: ShellChunkFailureHandler
) => UserMenuSlotFactory;

export interface ProtectedLayoutModule {
  readonly ProtectedRoute: ComponentType;
  readonly AppLayout: ComponentType<AppLayoutProps>;
  readonly ShellSlotFactory: UserMenuSlotFactoryClass;
}

export type ProtectedLayoutExport = 'ProtectedRoute' | 'AppLayout';

export interface ProtectedShell {
  readonly userMenu?: ShellSlotLoad | undefined;
  readonly report: ShellChunkFailureHandler;
}

export interface ProtectedLayout {
  readonly ProtectedRoute: ComponentType;
  readonly AppLayout: ComponentType<AppLayoutProps>;
  readonly userMenu?: UserMenuSlot | undefined;
}
