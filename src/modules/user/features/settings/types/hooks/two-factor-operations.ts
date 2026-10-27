import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

export interface TwoFactorSetup {
  readonly isSubmitting: boolean;
  readonly start: () => void;
  readonly confirm: (dto: TwoFactorDto) => void;
  readonly done: () => void;
  readonly retry: () => void;
}

export interface TwoFactorDisable {
  readonly isSubmitting: boolean;
  readonly open: () => void;
  readonly disable: (dto: TwoFactorDto) => void;
  readonly cancel: () => void;
  readonly retry: () => void;
}

export interface RecoveryCodesRegenerate {
  readonly isSubmitting: boolean;
  readonly open: () => void;
  readonly regenerate: () => void;
  readonly retry: () => void;
}
