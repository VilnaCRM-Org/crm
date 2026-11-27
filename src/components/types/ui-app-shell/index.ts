import type { ShellSlot, ShellSlotLayout } from '@/routes/types/shell-slot';

import type { SignOutHandler } from '../ui-sidebar';

export type ShellLayout = ShellSlotLayout;

export interface UIAppShellProps {
  readonly signOut: SignOutHandler;
  readonly userMenu?: ShellSlot | undefined;
  readonly notifications?: ShellSlot | undefined;
}
