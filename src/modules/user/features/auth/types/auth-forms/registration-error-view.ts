export interface Props {
  resolvedErrorText: string;
  isSubmitting: boolean;
  isClosing: boolean;
  onRetry?: () => void;
  onBack: () => void;
}
