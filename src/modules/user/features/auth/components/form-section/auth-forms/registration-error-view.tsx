import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ErrorImage } from '@/assets/notification/error.svg';
import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import { paletteColors } from '@/styles/colors';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import type { Props } from '@auth/types/auth-forms/registration-error-view';

import styles from './registration-notification.error-styles';

const headingFocusStyles = {
  outline: 'none',
  '&:focus-visible': {
    outline: `2px solid ${paletteColors.error.main}`,
    outlineOffset: '2px',
  },
};

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
  sx: SxProps<Theme>;
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

function ErrorMessage({ title, text }: { title: string; text: string }): JSX.Element {
  return (
    <>
      <UITypography component="h2" sx={styles.messageTitle}>
        {title}
      </UITypography>
      <Box role="alert">
        <UITypography component="span" sx={styles.messageDescription}>
          {text}
        </UITypography>
      </Box>
    </>
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
  const focusOnMount = useFocusOnMount<HTMLDivElement>();
  return (
    <Box sx={styles.notificationSection}>
      <Box sx={styles.contentBoxError}>
        <ErrorImageBlock label={t('notifications.error.images.error')} />
        <Box
          ref={focusOnMount}
          tabIndex={-1}
          sx={[styles.messageContainerError, headingFocusStyles]}
        >
          <ErrorMessage title={t('notifications.error.title')} text={resolvedErrorText} />
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
