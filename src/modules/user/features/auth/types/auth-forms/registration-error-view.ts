import type { SxProps, Theme } from '@mui/material/styles';

export interface Props {
  resolvedErrorText: string;
  submittingMessage: string;
  isSubmitting: boolean;
  isClosing: boolean;
  onRetry?: (() => void) | undefined;
  onBack: () => void;
}

export interface ErrorLabelProps {
  label: string;
}

export interface ErrorActionButtonProps {
  sx: SxProps<Theme>;
  variant: 'contained' | 'outlined';
  busy: boolean;
  onClick: () => void;
  label: string;
}

export interface ErrorButtonsProps {
  isSubmitting: boolean;
  isClosing: boolean;
  onRetry?: (() => void) | undefined;
  onBack: () => void;
  retryLabel: string;
  backLabel: string;
}

export interface ErrorMessageProps {
  title: string;
  text: string;
}

export interface ErrorAlertProps {
  text: string;
}
