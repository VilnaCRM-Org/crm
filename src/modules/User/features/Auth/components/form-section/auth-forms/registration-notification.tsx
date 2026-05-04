import { ReactComponent as ConfettiImage } from '@/assets/notification/confetti.svg';
import { ReactComponent as ErrorImage } from '@/assets/notification/error.svg';
import { ReactComponent as SettingsImage } from '@/assets/notification/settings.svg';
import UIButton from '@/components/ui-button';
import UiTypography from '@/components/ui-typography';
import { Box, Fade, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification.styles';
import { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';

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
  const normalizedErrorText = errorText?.trim().toLowerCase().replace(/\s+/g, ' ');
  const mappedErrorText =
    normalizedErrorText && GENERIC_REGISTRATION_VALIDATION_ERRORS.has(normalizedErrorText)
      ? t('sign_up.errors.signup_error')
      : errorText;
  const resolvedErrorText = normalizedErrorText
    ? mappedErrorText
    : t('failure_responses.client_errors.something_went_wrong');

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

  const errorButtonTextStyles = [styles.messageButtonText, styles.errorButtonMessage];

  if (view === 'error') {
    return (
      <Fade in={!isClosing} timeout={BACK_CLOSE_ANIMATION_MS} appear>
        <Box role="alert" aria-live="polite" sx={styles.notificationSection}>
          <Box sx={styles.contentBoxError}>
            <Box sx={styles.imageWrapperError}>
              <Box
                component={ErrorImage}
                role="img"
                aria-label={t('notifications.error.images.error')}
                sx={styles.errorImage}
              />
            </Box>

            <Box sx={styles.messageContainerError}>
              <UiTypography component="h4" sx={styles.messageTitle}>
                {t('notifications.error.title')}
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
                    <Typography component="span" sx={errorButtonTextStyles}>
                      {t('notifications.error.retry_button')}
                    </Typography>
                  </UIButton>
                ) : null}
                <UIButton
                  sx={[styles.errorButton, styles.errorButtonSecondary]}
                  variant="outlined"
                  type="button"
                  disabled={isClosing}
                  onClick={handleBack}
                >
                  <Typography component="span" sx={errorButtonTextStyles}>
                    {t('notifications.error.button')}
                  </Typography>
                </UIButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={!isClosing} timeout={BACK_CLOSE_ANIMATION_MS} appear>
      <Box role="alert" aria-live="polite" sx={styles.notificationSection}>
        <Box sx={styles.contentBox} aria-label={t('notifications.success.aria_label')}>
          <Box sx={styles.successTopImgBox}>
            <Box
              component={ConfettiImage}
              role="img"
              aria-label={t('notifications.success.images.confetti')}
              sx={styles.successTopConfetti}
            />
          </Box>
          <Box sx={styles.gears}>
            <Box
              component={SettingsImage}
              role="img"
              aria-label={t('notifications.success.images.gears')}
              sx={styles.successGears}
            />
          </Box>

          <Box sx={styles.messageContainer}>
            <UiTypography component="h4" sx={styles.successMessageTitle}>
              {t('notifications.success.title')}
            </UiTypography>
            <UiTypography component="span" sx={styles.successMessageDescription}>
              {t('notifications.success.description')}
            </UiTypography>

            <UIButton
              sx={styles.messageButton}
              variant="contained"
              type="button"
              size="medium"
              fullWidth
              disabled={isClosing}
              onClick={handleBack}
            >
              <Typography component="span" sx={styles.messageButtonText}>
                {t('notifications.success.button')}
              </Typography>
            </UIButton>
          </Box>

          <Box sx={styles.bottomImgBox}>
            <Box component={ConfettiImage} aria-hidden="true" sx={styles.successBottomConfetti} />
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}
