import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

export interface SignOutState extends ProtectedOutletContext {
  readonly signedOut: boolean;
}
