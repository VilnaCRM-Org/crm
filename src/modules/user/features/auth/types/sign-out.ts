import type { SignOutContext } from '@/routes/types/protected-outlet-context';

export interface SignOutState extends SignOutContext {
  readonly signedOut: boolean;
}
