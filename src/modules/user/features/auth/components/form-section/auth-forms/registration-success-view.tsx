import { Box, Typography } from '@mui/material';
import { type JSX, useEffect, useState } from 'react';

import { ReactComponent as ConfettiImage } from '@/assets/notification/confetti.svg';
import { ReactComponent as SettingsImage } from '@/assets/notification/settings.svg';
import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import { paletteColors } from '@/styles/colors';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import type {
  MessageContainerProps,
  Props,
  SuccessActionButtonProps,
  SuccessDescriptionProps,
  SuccessTitleProps,
} from '@auth/types/auth-forms/registration-success-view';

import styles from './registration-notification.success-styles';

const headingFocusStyles = {
  outline: 'none',
  '&:focus-visible': {
    outline: `2px solid ${paletteColors.primary.main}`,
    outlineOffset: '2px',
  },
};

function FocusableSuccessHeading({ title }: SuccessTitleProps): JSX.Element {
  const focusOnMount = useFocusOnMount<HTMLHeadingElement>();
  return (
    <UITypography
      component="h2"
      ref={focusOnMount}
      tabIndex={-1}
      sx={[styles.successMessageTitle, headingFocusStyles]}
    >
      {title}
    </UITypography>
  );
}

function SuccessDescription({ description }: SuccessDescriptionProps): JSX.Element {
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    setAnnounced(description);
  }, [description]);

  return (
    <UITypography component="span" role="status" sx={styles.successMessageDescription}>
      {announced}
    </UITypography>
  );
}

function ConfettiTop(): JSX.Element {
  return (
    <Box sx={styles.successTopImgBox}>
      <Box component={ConfettiImage} aria-hidden="true" sx={styles.successTopConfetti} />
    </Box>
  );
}

function GearsImage(): JSX.Element {
  return (
    <Box sx={styles.gears}>
      <Box component={SettingsImage} aria-hidden="true" sx={styles.successGears} />
    </Box>
  );
}

function ConfettiBottom(): JSX.Element {
  return (
    <Box sx={styles.bottomImgBox}>
      <Box component={ConfettiImage} aria-hidden="true" sx={styles.successBottomConfetti} />
    </Box>
  );
}

function SuccessActionButton({
  buttonLabel,
  disabled,
  onBack,
}: SuccessActionButtonProps): JSX.Element {
  return (
    <UIButton
      sx={styles.messageButton}
      variant="contained"
      type="button"
      size="medium"
      fullWidth
      disabled={disabled}
      onClick={onBack}
    >
      <Typography component="span" sx={styles.messageButtonText}>
        {buttonLabel}
      </Typography>
    </UIButton>
  );
}

function MessageContainer({
  title,
  description,
  buttonLabel,
  disabled,
  onBack,
}: MessageContainerProps): JSX.Element {
  return (
    <Box sx={styles.messageContainer}>
      <FocusableSuccessHeading title={title} />
      <SuccessDescription description={description} />
      <SuccessActionButton buttonLabel={buttonLabel} disabled={disabled} onBack={onBack} />
    </Box>
  );
}

export default function RegistrationSuccessView({
  isClosing,
  onBack,
  title,
  description,
  buttonLabel,
}: Props): JSX.Element {
  return (
    <Box sx={styles.notificationSection}>
      <Box sx={styles.contentBox}>
        <ConfettiTop />
        <GearsImage />
        <MessageContainer
          title={title}
          description={description}
          buttonLabel={buttonLabel}
          disabled={isClosing}
          onBack={onBack}
        />
        <ConfettiBottom />
      </Box>
    </Box>
  );
}
