import { Box, Fade, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ConfettiImage } from '@/assets/notification/confetti.svg';
import { ReactComponent as ErrorImage } from '@/assets/notification/error.svg';
import { ReactComponent as SettingsImage } from '@/assets/notification/settings.svg';
import UIButton from '@/components/ui-button';
import UiTypography from '@/components/ui-typography';
import { RegistrationView } from '@auth/components/form-section/types';

import styles from './registration-notification.styles';

type RegistrationNotificationProps = {
  view: Exclude<RegistrationView, 'form'>;
  errorText?: string;
  isSubmitting: boolean;
  onShown?: () => void;
  onBack: () => void;
  onRetry?: () => void;
};

export const BACK_CLOSE_ANIMATION_MS = 300;
const GENERIC_REGISTRATION_VALIDATION_ERRORS = new Set([
  'invalid data provided',
  'invalid registration data',
  'unprocessable registration data',
]);
const ERROR_BUTTON_TEXT_STYLES = [styles.messageButtonText, styles.errorButtonMessage];

type ErrorNotificationContentProps = {
  backButtonLabel: string;
  errorImageLabel: string;
  isClosing: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onRetry?: () => void;
  resolvedErrorText: string;
  retryButtonLabel: string;
  title: string;
};

type SuccessNotificationContentProps = {
  backButtonLabel: string;
  confettiImageLabel: string;
  description: string;
  gearsImageLabel: string;
  isClosing: boolean;
  onBack: () => void;
  title: string;
};

function resolveErrorText(
  errorText: string | undefined,
  signupErrorText: string,
  fallbackErrorText: string
): string {
  const normalizedErrorText = errorText?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!errorText || !normalizedErrorText) {
    return fallbackErrorText;
  }

  return GENERIC_REGISTRATION_VALIDATION_ERRORS.has(normalizedErrorText)
    ? signupErrorText
    : errorText;
}

function ErrorNotificationContent({
  backButtonLabel,
  errorImageLabel,
  isClosing,
  isSubmitting,
  onBack,
  onRetry,
  resolvedErrorText,
  retryButtonLabel,
  title,
}: ErrorNotificationContentProps): JSX.Element {
  return (
    <Box sx={styles.contentBoxError}>
      <Box sx={styles.imageWrapperError}>
        <Box
          component={ErrorImage}
          role="img"
          aria-label={errorImageLabel}
          sx={styles.errorImage}
        />
      </Box>

      <Box sx={styles.messageContainerError}>
        <UiTypography component="h4" sx={styles.messageTitle}>
          {title}
        </UiTypography>
        <UiTypography component="span" sx={styles.messageDescription}>
          {resolvedErrorText}
        </UiTypography>

        <Box sx={styles.buttonsBox}>
          {onRetry != null ? (
            <UIButton
              sx={styles.errorButton}
              variant="contained"
              type="button"
              disabled={isSubmitting || isClosing}
              onClick={onRetry}
            >
              <Typography component="span" sx={ERROR_BUTTON_TEXT_STYLES}>
                {retryButtonLabel}
              </Typography>
            </UIButton>
          ) : null}
          <UIButton
            sx={[styles.errorButton, styles.errorButtonSecondary]}
            variant="outlined"
            type="button"
            disabled={isClosing}
            onClick={onBack}
          >
            <Typography component="span" sx={ERROR_BUTTON_TEXT_STYLES}>
              {backButtonLabel}
            </Typography>
          </UIButton>
        </Box>
      </Box>
    </Box>
  );
}

function SuccessNotificationContent({
  backButtonLabel,
  confettiImageLabel,
  description,
  gearsImageLabel,
  isClosing,
  onBack,
  title,
}: SuccessNotificationContentProps): JSX.Element {
  return (
    <Box sx={styles.contentBox} aria-label={title}>
      <Box sx={styles.successTopImgBox}>
        <Box
          component={ConfettiImage}
          role="img"
          aria-label={confettiImageLabel}
          sx={styles.successTopConfetti}
        />
      </Box>
      <Box sx={styles.gears}>
        <Box
          component={SettingsImage}
          role="img"
          aria-label={gearsImageLabel}
          sx={styles.successGears}
        />
      </Box>

      <Box sx={styles.messageContainer}>
        <UiTypography
          component="h4"
          sx={styles.successMessageTitle}
          data-testid="success-notification-title"
        >
          {title}
        </UiTypography>
        <UiTypography component="span" sx={styles.successMessageDescription}>
          {description}
        </UiTypography>

        <UIButton
          sx={styles.messageButton}
          variant="contained"
          type="button"
          size="medium"
          fullWidth
          disabled={isClosing}
          onClick={onBack}
        >
          <Typography component="span" sx={styles.messageButtonText}>
            {backButtonLabel}
          </Typography>
        </UIButton>
      </Box>

      <Box sx={styles.bottomImgBox}>
        <Box component={ConfettiImage} aria-hidden="true" sx={styles.successBottomConfetti} />
      </Box>
    </Box>
  );
}

export default function RegistrationNotification({
  view,
  errorText,
  isSubmitting,
  onShown,
  onBack,
  onRetry,
}: RegistrationNotificationProps): JSX.Element {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedErrorText = resolveErrorText(
    errorText,
    t('sign_up.errors.signup_error'),
    t('failure_responses.client_errors.something_went_wrong')
  );

  useEffect(() => {
    if (view === 'success') {
      onShown?.();
    }
  }, [onShown, view]);

  useEffect(
    (): (() => void) => (): void => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    },
    []
  );

  const handleBack = useCallback(() => {
    if (view === 'success') {
      onBack();
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onBack();
    }, BACK_CLOSE_ANIMATION_MS);
  }, [onBack, view]);

  return (
    <Fade in={!isClosing} timeout={BACK_CLOSE_ANIMATION_MS} appear>
      <Box role="alert" aria-live="polite" sx={styles.notificationSection}>
        {view === 'error' ? (
          <ErrorNotificationContent
            backButtonLabel={t('notifications.error.button')}
            errorImageLabel={t('notifications.error.images.error')}
            isClosing={isClosing}
            isSubmitting={isSubmitting}
            onBack={handleBack}
            onRetry={onRetry}
            resolvedErrorText={resolvedErrorText}
            retryButtonLabel={t('notifications.error.retry_button')}
            title={t('notifications.error.title')}
          />
        ) : (
          <SuccessNotificationContent
            backButtonLabel={t('notifications.success.button')}
            confettiImageLabel={t('notifications.success.images.confetti')}
            description={t('notifications.success.description')}
            gearsImageLabel={t('notifications.success.images.gears')}
            isClosing={isClosing}
            onBack={handleBack}
            title={t('notifications.success.title')}
          />
        )}
      </Box>
    </Fade>
  );
}
