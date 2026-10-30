import type { UIFormErrorAction, UIFormProps } from '@/components/types/ui-form';
import type { TwoFactorCodeKind } from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';

export interface ChallengeCodeFieldProps {
  readonly state: TwoFactorChallengeState;
}

export interface RecoveryCodeFieldProps {
  readonly state: TwoFactorChallengeState;
}

export interface ModeToggleProps {
  readonly mode: TwoFactorCodeKind;
  readonly busy: boolean;
  readonly onSwitch: () => void;
}

export interface ChallengeBannerProps {
  readonly error: string | null;
  readonly action: UIFormErrorAction | undefined;
}

export interface ChallengeCopy {
  readonly title: string;
  readonly subtitle: string;
  readonly note: string;
  readonly submitLabel: string;
  readonly submittingLabel: string;
}

export type ChallengeFormProps = Omit<
  UIFormProps<TwoFactorDto>,
  'children' | 'isSubmitting' | 'titleComponent'
>;

export interface ChallengeNoteProps {
  readonly text: string;
}
