import type { SvgIconComponent } from '@mui/icons-material';

import type { ArrivalNotice } from '@/routes/types/navigation-state';

export interface SignInNoticeProps {
  readonly notice: ArrivalNotice | null;
}

export type SignInNoticeTone = 'success' | 'neutral';

export interface SignInNoticeRow {
  readonly messageKey: string;
  readonly tone: SignInNoticeTone;
  readonly Icon: SvgIconComponent;
}

export interface SignInNoticeMessageTable {
  readonly password_reset: SignInNoticeRow;
  readonly session_ended: SignInNoticeRow;
  readonly two_factor_expired: SignInNoticeRow;
  readonly account_locked: SignInNoticeRow;
}
