import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { forwardRef, type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { UIToastProps } from '@/components/types/ui-toast';

import styles from './styles';
import ToastIcon from './toast-icon';

function ToastActionButton({ toast, onDismiss }: UIToastProps): JSX.Element | null {
  const { action, id } = toast;
  if (!action) return null;

  return (
    <Box
      component="button"
      type="button"
      sx={styles.action}
      onClick={() => {
        onDismiss(id);
        action.onActivate();
      }}
    >
      {action.label}
    </Box>
  );
}

const UIToast = forwardRef<HTMLButtonElement, UIToastProps>(function UIToast(
  { toast, onDismiss },
  closeRef
): JSX.Element {
  const { t } = useTranslation();
  const { id, message, tone } = toast;

  return (
    <Box role={tone === 'error' ? 'alert' : undefined} sx={[styles.toast, styles.tones[tone]]}>
      <Box component="span" sx={[styles.icon, styles.iconTones[tone]]}>
        <ToastIcon name={tone === 'error' ? 'alert' : 'check'} />
      </Box>
      <Box component="span" sx={styles.message}>
        {message}
      </Box>
      <ToastActionButton toast={toast} onDismiss={onDismiss} />
      <IconButton
        ref={closeRef}
        aria-label={t('ui_toast.close')}
        sx={styles.close}
        onClick={() => onDismiss(id)}
      >
        <ToastIcon name="close" />
      </IconButton>
    </Box>
  );
});

export default UIToast;
