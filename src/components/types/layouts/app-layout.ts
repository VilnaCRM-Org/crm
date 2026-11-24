import type { ShellFailureHandler, UserMenuSlot } from '@/routes/types/shell-slot';

export interface AppLayoutProps {
  readonly userMenu?: UserMenuSlot | undefined;
  readonly onShellFailure?: ShellFailureHandler | undefined;
}
