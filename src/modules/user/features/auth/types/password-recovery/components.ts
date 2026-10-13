import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

export type InCardLinkVariant = 'text' | 'contained';

export interface InCardLinkProps {
  to: string;
  variant: InCardLinkVariant;
  sx: SxProps<Theme>;
  children: ReactNode;
}

export interface CardBackControlProps {
  to?: string | undefined;
  onClick?: (() => void) | undefined;
}

export interface RecoveryResultAction {
  readonly label: string;
  readonly to: string;
}

export interface RecoveryResultViewProps {
  title: string;
  body: string;
  action: RecoveryResultAction;
}
