import { ReactComponent as ErrorImage } from '@/assets/notification/error.svg';
import UIButton from '@/components/UIButton';
import UiTypography from '@/components/UITypography';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import styles from './registration-notification.error-styles';

interface Props {
  resolvedErrorText: string;
  isSubmitting: boolean;
  isClosing: boolean;
  onRetry?: () => void;
  onBack: () => void;
}

const buttonTextStyles = [styles.messageButtonText, styles.errorButtonMessage];

function ErrorImageBlock({ label }: { label: string }): JSX.Element {
  return (
    <Box sx={styles.imageWrapperError}>
      <Box component={ErrorImage} role="img" aria-label={label} sx={styles.errorImage} />
    </Box>
  );
}

function ErrorActionButton({
  sx,
  variant,
  disabled,
  onClick,
  label,
}: {
  sx: object | object[];
  variant: 'contained' | 'outlined';
  disabled: boolean;
  onClick: () => void;
  label: string;
}): JSX.Element {
  return (
    <UIButton sx={sx} variant={variant} type="button" disabled={disabled} onClick={onClick}>
      <Typography component="span" sx={buttonTextStyles}>
        {label}
      </Typography>
    </UIButton>
  );
}

function ErrorButtons({
  isSubmitting,
  isClosing,
  onRetry,
  onBack,
  retryLabel,
  backLabel,
}: {
  isSubmitting: boolean;
  isClosing: boolean;
  onRetry?: () => void;
  onBack: () => void;
  retryLabel: string;
  backLabel: string;
}): JSX.Element {
  return (
    <Box sx={styles.buttonsBox}>
      {onRetry != null && (
        <ErrorActionButton
          sx={styles.errorButton}
          variant="contained"
          disabled={isSubmitting || isClosing}
          onClick={onRetry}
          label={retryLabel}
        />
      )}
      <ErrorActionButton
        sx={[styles.errorButton, styles.errorButtonSecondary]}
        variant="outlined"
        disabled={isClosing}
        onClick={onBack}
        label={backLabel}
      />
    </Box>
  );
}

export default function RegistrationErrorView({
  resolvedErrorText,
  isSubmitting,
  isClosing,
  onRetry,
  onBack,
}: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <Box role="alert" aria-live="polite" sx={styles.notificationSection}>
      <Box sx={styles.contentBoxError}>
        <ErrorImageBlock label={t('notifications.error.images.error')} />
        <Box sx={styles.messageContainerError}>
          <UiTypography component="h4" sx={styles.messageTitle}>
            {t('notifications.error.title')}
          </UiTypography>
          <UiTypography component="span" sx={styles.messageDescription}>
            {resolvedErrorText}
          </UiTypography>
          <ErrorButtons
            isSubmitting={isSubmitting}
            isClosing={isClosing}
            onRetry={onRetry}
            onBack={onBack}
            retryLabel={t('notifications.error.retry_button')}
            backLabel={t('notifications.error.button')}
          />
        </Box>
      </Box>
    </Box>
  );
}
