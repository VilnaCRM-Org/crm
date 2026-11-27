import type { ComponentType } from 'react';

import type { AppLayoutProps } from '@/components/types/layouts/app-layout';

import type {
  ShellChunkFailureHandler,
  ShellSlot,
  ShellSlotLoad,
  ShellSlotSource,
} from './shell-slot';

export interface ShellSlotRequest {
  readonly load: ShellSlotLoad;
  readonly source: ShellSlotSource;
}

export interface ShellSlotBuilder {
  create(load: ShellSlotLoad, source: ShellSlotSource): ShellSlot;
}

export type ShellSlotBuilderClass = new (report: ShellChunkFailureHandler) => ShellSlotBuilder;

export interface ProtectedLayoutModule {
  readonly ProtectedRoute: ComponentType;
  readonly AppLayout: ComponentType<AppLayoutProps>;
  readonly ShellSlotFactory: ShellSlotBuilderClass;
}

export type ProtectedLayoutExport = 'ProtectedRoute' | 'AppLayout';

export interface ProtectedShellLoads {
  readonly userMenu?: ShellSlotLoad | undefined;
  readonly notifications?: ShellSlotLoad | undefined;
}

export interface ProtectedShell extends ProtectedShellLoads {
  readonly report: ShellChunkFailureHandler;
}

export interface ProtectedLayout {
  readonly ProtectedRoute: ComponentType;
  readonly AppLayout: ComponentType<AppLayoutProps>;
  readonly userMenu?: ShellSlot | undefined;
  readonly notifications?: ShellSlot | undefined;
}
