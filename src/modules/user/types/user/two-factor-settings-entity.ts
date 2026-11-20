import type { TwoFactorStatus } from '@/routes/types/protected-outlet-context';

export interface RecoveryCode {
  readonly value: string;
}

export interface RecoveryCodeSet {
  readonly items: readonly RecoveryCode[];
}

export interface TwoFactorSettingsEntity {
  readonly status: TwoFactorStatus;
  readonly otpauthUri: string | null;
  readonly secret: string | null;
  readonly recoveryCodes: RecoveryCodeSet | null;
}
