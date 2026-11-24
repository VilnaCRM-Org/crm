import type { UserMenuSlot } from '@/routes/types/shell-slot';

import type { SignOutHandler } from '../ui-sidebar';

export type ShellLayout = 'mobile' | 'tablet' | 'desktop';

export interface UIAppShellProps {
  readonly signOut: SignOutHandler;
  readonly userMenu?: UserMenuSlot | undefined;
}
