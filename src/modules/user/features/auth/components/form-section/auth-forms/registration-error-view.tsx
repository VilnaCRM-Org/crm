import { Box, Typography } from '@mui/material';
import { type JSX, type RefObject, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ErrorImage } from '@/assets/notification/error.svg';
import UIButton from '@/components/ui-button';
import UILiveStatus from '@/components/ui-live-status';
import UITypography from '@/components/ui-typography';
import type {
  ErrorActionButtonProps,
  ErrorAlertProps,
  ErrorButtonsProps,
  ErrorLabelProps,
  ErrorMessageProps,
  Props,
} from '@auth/types/auth-forms/registration-error-view';

import styles from './registration-notification.error-styles';

const buttonTextStyles = [styles.messageButtonText, styles.errorButtonMessage];

function ErrorImageBlock({ label }: ErrorLabelProps): JSX.Element {
  return (
    <Box sx={styles.imageWrapperError}>
      <Box component={ErrorImage} role="img" aria-label={label} sx={styles.errorImage} />
    </Box>
  );
}

function ErrorActionButton({
  sx,
  variant,
  busy,
  onClick,
  label,
}: ErrorActionButtonProps): JSX.Element {
  return (
    <UIButton
      sx={sx}
      variant={variant}
      type="button"
      aria-disabled={busy || undefined}
      onClick={(): void => {
        if (!busy) onClick();
      }}
    >
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
}: ErrorButtonsProps): JSX.Element {
  return (
    <Box sx={styles.buttonsBox}>
      {onRetry != null && (
        <ErrorActionButton
          sx={styles.errorButton}
          variant="contained"
          busy={isSubmitting || isClosing}
          onClick={onRetry}
          label={retryLabel}
        />
      )}
      <ErrorActionButton
        sx={[styles.errorButton, styles.errorButtonSecondary]}
        variant="outlined"
        busy={isClosing}
        onClick={onBack}
        label={backLabel}
      />
    </Box>
  );
}

function ErrorAlert({ text }: ErrorAlertProps): JSX.Element {
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    setAnnounced(text);
  }, [text]);

  return (
    <UITypography component="span" role="alert" sx={styles.messageDescription}>
      {announced}
    </UITypography>
  );
}

function useHeadingFocus(text: string): RefObject<HTMLHeadingElement | null> {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const focusedOnce = useRef(false);

  useEffect(() => {
    if (!focusedOnce.current || document.activeElement === document.body) {
      headingRef.current?.focus();
    }
    focusedOnce.current = true;
  }, [text]);

  return headingRef;
}

function ErrorMessage({ title, text }: ErrorMessageProps): JSX.Element {
  const headingRef = useHeadingFocus(text);
  return (
    <>
      <UITypography
        component="h2"
        ref={headingRef}
        tabIndex={-1}
        sx={[styles.messageTitle, styles.headingFocus]}
      >
        {title}
      </UITypography>
      <ErrorAlert text={text} />
    </>
  );
}

export default function RegistrationErrorView({
  resolvedErrorText,
  submittingMessage,
  isSubmitting,
  isClosing,
  onRetry,
  onBack,
}: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <Box sx={styles.notificationSection}>
      <Box sx={styles.contentBoxError}>
        <ErrorImageBlock label={t('notifications.error.images.error')} />
        <Box sx={styles.messageContainerError}>
          <ErrorMessage
            title={t('notifications.error.title')}
            text={isSubmitting ? '' : resolvedErrorText}
          />
          <ErrorButtons
            isSubmitting={isSubmitting}
            isClosing={isClosing}
            onRetry={onRetry}
            onBack={onBack}
            retryLabel={t('notifications.error.retry_button')}
            backLabel={t('notifications.error.button')}
          />
          <UILiveStatus message={isSubmitting ? submittingMessage : ''} />
        </Box>
      </Box>
    </Box>
  );
}
