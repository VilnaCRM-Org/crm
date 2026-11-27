import type { ShellFailureHandler, ShellSlot } from '@/routes/types/shell-slot';

export interface AppLayoutProps {
  readonly userMenu?: ShellSlot | undefined;
  readonly notifications?: ShellSlot | undefined;
  readonly onShellFailure?: ShellFailureHandler | undefined;
}
