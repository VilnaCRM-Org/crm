import { ReactComponent as ConfettiImage } from '@/assets/notification/confetti.svg';
import { ReactComponent as ErrorImage } from '@/assets/notification/error.svg';
import { ReactComponent as SettingsImage } from '@/assets/notification/settings.svg';
import UIButton from '@/components/ui-button';
import UiTypography from '@/components/ui-typography';
import CloseIcon from '@mui/icons-material/Close';
import { Box, CircularProgress, IconButton } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationView } from '../types';

import styles from './registration-notification.styles';

type RegistrationNotificationProps = {
  view: Exclude<RegistrationView, 'form'>;
  errorText?: string;
  isSubmitting: boolean;
  onBack: () => void;
  onRetry?: () => void;
};

const BACK_CLOSE_ANIMATION_MS = 240;

export default function RegistrationNotification({
  view,
  errorText,
  isSubmitting,
  onBack,
  onRetry,
}: RegistrationNotificationProps): JSX.Element {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    (): (() => void) => (): void => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const handleBack = useCallback(() => {
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onBack();
    }, BACK_CLOSE_ANIMATION_MS);
  }, [onBack]);

  if (view === 'error') {
    return (
      <Box
        role="alert"
        aria-live="polite"
        sx={[styles.notificationSection, isClosing ? styles.notificationSectionClosing : {}]}
      >
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
              {errorText || t('failure_responses.client_errors.something_went_wrong')}
            </UiTypography>

            <Box sx={styles.buttonsBox}>
              <UIButton
                sx={styles.errorButton}
                variant="contained"
                type="button"
                disabled={isSubmitting || isClosing}
                onClick={onRetry}
              >
                {t('notifications.error.retry_button')}
              </UIButton>
              <UIButton
                sx={[styles.errorButton, styles.errorButtonSecondary]}
                variant="outlined"
                type="button"
                disabled={isSubmitting || isClosing}
                onClick={handleBack}
              >
                {t('notifications.error.button')}
              </UIButton>
            </Box>
          </Box>
        </Box>
        {isSubmitting && <CircularProgress color="primary" size={70} sx={styles.loader} />}
      </Box>
    );
  }

  return (
    <Box
      role="alert"
      aria-live="polite"
      sx={[styles.notificationSection, isClosing ? styles.notificationSectionClosing : {}]}
    >
      <IconButton
        aria-label={t('notifications.close')}
        onClick={handleBack}
        disabled={isClosing}
        sx={styles.closeButton}
      >
        <CloseIcon />
      </IconButton>
      <Box sx={styles.contentBox}>
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
          <Box sx={styles.successTextGroup}>
            <UiTypography component="h4" sx={styles.successMessageTitle}>
              {t('notifications.success.title')}
            </UiTypography>
            <UiTypography component="span" sx={styles.successMessageDescription}>
              {t('notifications.success.description')}
            </UiTypography>
          </Box>

          <UIButton sx={styles.messageButton} variant="contained" type="button" to="/">
            {t('notifications.success.button')}
          </UIButton>
        </Box>

        <Box sx={styles.bottomImgBox}>
          <Box component={ConfettiImage} aria-hidden="true" sx={styles.successBottomConfetti} />
        </Box>
      </Box>
    </Box>
  );
}
