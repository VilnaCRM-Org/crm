import { Box, Fade } from '@mui/material';
import { type JSX, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  AuthNotificationCopyTable,
  AuthNotificationFlow,
  Props,
  ResolvedNotificationCopy,
} from '@auth/types/auth-forms/registration-notification';

import RegistrationErrorView from './registration-error-view';
import styles from './registration-notification.styles';
import RegistrationSuccessView from './registration-success-view';
import useCloseTimer from './use-registration-close-timer';
import useResolvedErrorText from './use-resolved-error-text';

export const BACK_CLOSE_ANIMATION_MS = 300;

const COPY: AuthNotificationCopyTable = {
  signUp: {
    successTitle: 'notifications.success.title',
    successDescription: 'notifications.success.description',
    successButton: 'notifications.success.button',
    submitting: 'sign_up.form.submitting',
  },
  signIn: {
    successTitle: 'sign_in.success.title',
    successDescription: 'sign_in.success.description',
    successButton: 'sign_in.success.button',
    submitting: 'sign_in.form.submitting',
  },
};

function useNotificationCopy(
  flow: AuthNotificationFlow,
  errorText: string | undefined
): ResolvedNotificationCopy {
  const { t } = useTranslation();
  const registrationErrorText = useResolvedErrorText(errorText);
  const copy = COPY[flow];
  return {
    errorText: flow === 'signIn' ? (errorText ?? '') : registrationErrorText,
    submitting: t(copy.submitting),
    successTitle: t(copy.successTitle),
    successDescription: t(copy.successDescription),
    successButton: t(copy.successButton),
  };
}

function useSuccessShown(view: Props['view'], onShown: Props['onShown']): void {
  useEffect(() => {
    if (view === 'success') onShown?.();
  }, [onShown, view]);
}

function useBackHandler(
  view: Props['view'],
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
  flow = 'signUp',
  errorText,
  isSubmitting,
  onShown,
  onBack,
  onRetry,
}: Props): JSX.Element {
  const [isClosing, setIsClosing] = useState(false);
  const copy = useNotificationCopy(flow, errorText);
  const handleBack = useBackHandler(view, onBack, setIsClosing);
  useSuccessShown(view, onShown);

  return (
    <Fade in={!isClosing} timeout={BACK_CLOSE_ANIMATION_MS} appear>
      <Box sx={styles.notificationSection}>
        {view === 'error' ? (
          <RegistrationErrorView
            isClosing={isClosing}
            isSubmitting={isSubmitting}
            onBack={handleBack}
            onRetry={onRetry}
            resolvedErrorText={copy.errorText}
            submittingMessage={copy.submitting}
          />
        ) : (
          <RegistrationSuccessView
            isClosing={isClosing}
            onBack={handleBack}
            title={copy.successTitle}
            description={copy.successDescription}
            buttonLabel={copy.successButton}
          />
        )}
      </Box>
    </Fade>
  );
}
