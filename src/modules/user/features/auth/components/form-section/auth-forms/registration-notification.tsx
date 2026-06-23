import { Box, Fade } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import type { RegistrationNotificationProps } from '@auth/types/auth-forms/registration-notification';

import RegistrationErrorView from './registration-error-view';
import styles from './registration-notification.styles';
import RegistrationSuccessView from './registration-success-view';
import useCloseTimer from './use-registration-close-timer';
import useResolvedErrorText from './use-resolved-error-text';

export const BACK_CLOSE_ANIMATION_MS = 300;

function useBackHandler(
  view: RegistrationNotificationProps['view'],
  onBack: () => void,
  setIsClosing: (v: boolean) => void
): () => void {
  const { scheduleClose } = useCloseTimer();
  return useCallback(() => {
    if (view === 'success') {
      onBack();
      return;
    }
    setIsClosing(true);
    scheduleClose(onBack, BACK_CLOSE_ANIMATION_MS);
  }, [onBack, scheduleClose, setIsClosing, view]);
}

export default function RegistrationNotification({
  view,
  errorText,
  isSubmitting,
  onShown,
  onBack,
  onRetry,
}: RegistrationNotificationProps): JSX.Element {
  const [isClosing, setIsClosing] = useState(false);
  const resolvedErrorText = useResolvedErrorText(errorText);
  const handleBack = useBackHandler(view, onBack, setIsClosing);

  useEffect(() => {
    if (view === 'success') onShown?.();
  }, [onShown, view]);

  return (
    <Fade in={!isClosing} timeout={BACK_CLOSE_ANIMATION_MS} appear>
      <Box sx={styles.notificationSection}>
        {view === 'error' ? (
          <RegistrationErrorView
            isClosing={isClosing}
            isSubmitting={isSubmitting}
            onBack={handleBack}
            onRetry={onRetry}
            resolvedErrorText={resolvedErrorText}
          />
        ) : (
          <RegistrationSuccessView isClosing={isClosing} onBack={handleBack} />
        )}
      </Box>
    </Fade>
  );
}
