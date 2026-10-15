import type { ArrivalNotice } from '@/routes/types/navigation-state';

export interface SignInNoticeProps {
  readonly notice: ArrivalNotice | null;
}

export interface SignInNoticeMessageTable {
  readonly password_reset: string;
}
