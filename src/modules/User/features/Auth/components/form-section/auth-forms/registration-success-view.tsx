import { ReactComponent as ConfettiImage } from '@/assets/notification/confetti.svg';
import { ReactComponent as SettingsImage } from '@/assets/notification/settings.svg';
import UIButton from '@/components/UIButton';
import UiTypography from '@/components/UITypography';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import styles from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification.success-styles';

interface Props {
  isClosing: boolean;
  onBack: () => void;
}

function ConfettiTop({ label }: { label: string }): JSX.Element {
  return (
    <Box sx={styles.successTopImgBox}>
      <Box component={ConfettiImage} role="img" aria-label={label} sx={styles.successTopConfetti} />
    </Box>
  );
}

function GearsImage({ label }: { label: string }): JSX.Element {
  return (
    <Box sx={styles.gears}>
      <Box component={SettingsImage} role="img" aria-label={label} sx={styles.successGears} />
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
}: {
  buttonLabel: string;
  disabled: boolean;
  onBack: () => void;
}): JSX.Element {
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
}: {
  title: string;
  description: string;
  buttonLabel: string;
  disabled: boolean;
  onBack: () => void;
}): JSX.Element {
  return (
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
      <SuccessActionButton buttonLabel={buttonLabel} disabled={disabled} onBack={onBack} />
    </Box>
  );
}

export default function RegistrationSuccessView({ isClosing, onBack }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <Box role="alert" aria-live="polite" sx={styles.notificationSection}>
      <Box sx={styles.contentBox} aria-label={t('notifications.success.title')}>
        <ConfettiTop label={t('notifications.success.images.confetti')} />
        <GearsImage label={t('notifications.success.images.gears')} />
        <MessageContainer
          title={t('notifications.success.title')}
          description={t('notifications.success.description')}
          buttonLabel={t('notifications.success.button')}
          disabled={isClosing}
          onBack={onBack}
        />
        <ConfettiBottom />
      </Box>
    </Box>
  );
}
