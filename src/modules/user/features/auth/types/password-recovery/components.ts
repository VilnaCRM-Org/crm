import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import type { RecoveryFailure } from '@auth/types/password-recovery/outcome';

export type InCardLinkVariant = 'text' | 'contained';

export interface InCardLinkProps {
  to: string;
  variant: InCardLinkVariant;
  sx: SxProps<Theme>;
  children: ReactNode;
}

export interface CardBackLinkProps {
  to: string;
  onClick?: never;
}

export interface CardBackButtonProps {
  to?: never;
  onClick: () => void;
}

export type CardBackControlProps = CardBackLinkProps | CardBackButtonProps;

export interface RecoveryResultAction {
  readonly label: string;
  readonly to: string;
}

export interface RecoveryResultViewProps {
  title: string;
  body: string;
  action: RecoveryResultAction;
}

export interface ResetPasswordFormProps {
  defaultValues: RestorePasswordDto;
  onSubmit: (dto: RestorePasswordDto) => Promise<void>;
  onDismissFailure: () => void;
  failure: RecoveryFailure | null;
  isSubmitting: boolean;
  focusTitle: boolean;
}

export interface ResetPasswordEmailFieldProps {
  failure: RecoveryFailure | null;
}

export interface ResetPasswordSentStepProps {
  maskedEmail: string | null;
  onBack: () => void;
}

export interface CreateNewPasswordFormProps {
  token: string;
  onSubmit: (dto: CreateNewPasswordDto) => Promise<void>;
  onDismissFailure: () => void;
  failure: RecoveryFailure | null;
  isSubmitting: boolean;
}

export interface CreateNewPasswordFieldsProps {
  failure: RecoveryFailure | null;
}
