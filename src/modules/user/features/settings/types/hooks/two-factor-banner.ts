import type { UIFormErrorAction } from '@/components/types/ui-form';

export interface TwoFactorBanner {
  readonly error: string | null;
  readonly action: UIFormErrorAction | undefined;
}
