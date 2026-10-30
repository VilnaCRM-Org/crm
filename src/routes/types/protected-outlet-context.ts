import type { ReactNode } from 'react';

export type TwoFactorStatus = 'enabled' | 'disabled' | 'unknown';

export interface ProtectedOutletContext {
  readonly signOut: () => void;
  readonly twoFactorStatus: TwoFactorStatus;
  readonly setTwoFactorStatus: (status: TwoFactorStatus) => void;
  readonly banner?: ReactNode | undefined;
}

export type SignOutContext = Pick<ProtectedOutletContext, 'signOut'>;
