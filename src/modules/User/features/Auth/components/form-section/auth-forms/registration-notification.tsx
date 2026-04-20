import { Box, Fade } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';

import RegistrationErrorView from './registration-error-view';
import RegistrationSuccessView from './registration-success-view';
import useCloseTimer from './use-registration-close-timer';
import useResolvedErrorText from './use-resolved-error-text';

type RegistrationNotificationProps = {
  view: Exclude<RegistrationView, 'form'>;
  errorText?: string;
  isSubmitting: boolean;
  onShown?: () => void;
  onBack: () => void;
  onRetry?: () => void;
};

export const BACK_CLOSE_ANIMATION_MS = 300;

function useShownCallback(view: string, onShown?: () => void): void {
  useEffect(() => {
    if (view === 'success') onShown?.();
  }, [onShown, view]);
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
  const { scheduleClose } = useCloseTimer();
  const resolvedErrorText = useResolvedErrorText(errorText);

  useShownCallback(view, onShown);

  const handleBack = useCallback(() => {
    if (view === 'success') {
      onBack();
      return;
    }
    setIsClosing(true);
    scheduleClose(onBack, BACK_CLOSE_ANIMATION_MS);
  }, [onBack, scheduleClose, view]);

  return (
    <Fade in={!isClosing} timeout={BACK_CLOSE_ANIMATION_MS} appear>
      <Box>
        {view === 'error' ? (
          <RegistrationErrorView
            resolvedErrorText={resolvedErrorText}
            isSubmitting={isSubmitting}
            isClosing={isClosing}
            onRetry={onRetry}
            onBack={handleBack}
          />
        ) : (
          <RegistrationSuccessView isClosing={isClosing} onBack={handleBack} />
        )}
      </Box>
    </Fade>
  );
}
