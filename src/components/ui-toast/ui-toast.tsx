import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { forwardRef, type JSX, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  ToastActionButtonProps,
  ToastCloseButtonProps,
  UIToastProps,
} from '@/components/types/ui-toast';

import styles from './styles';
import ToastIcon from './toast-icon';

function ToastActionButton({ id, action, onDismiss }: ToastActionButtonProps): JSX.Element {
  const activate = useCallback((): void => {
    onDismiss(id);
    action.onActivate();
  }, [action, id, onDismiss]);

  return (
    <Box component="button" type="button" sx={styles.action} onClick={activate}>
      {action.label}
    </Box>
  );
}

function ToastCloseButton({
  id,
  describedBy,
  closeRef,
  onDismiss,
}: ToastCloseButtonProps): JSX.Element {
  const { t } = useTranslation();
  const dismiss = useCallback((): void => onDismiss(id), [id, onDismiss]);

  return (
    <IconButton
      ref={closeRef}
      aria-label={t('ui_toast.close')}
      aria-describedby={describedBy}
      sx={styles.close}
      onClick={dismiss}
    >
      <ToastIcon name="close" />
    </IconButton>
  );
}

const UIToast = forwardRef<HTMLButtonElement, UIToastProps>(function UIToast(
  { toast, onDismiss },
  closeRef
): JSX.Element {
  const messageId = useId();
  const { id, message, tone, action } = toast;

  return (
    <Box sx={[styles.toast, styles.tones[tone]]}>
      <Box component="span" sx={[styles.icon, styles.iconTones[tone]]}>
        <ToastIcon name={tone === 'error' ? 'alert' : 'check'} />
      </Box>
      <Box component="span" id={messageId} sx={styles.message}>
        {message}
      </Box>
      {action === undefined ? null : (
        <ToastActionButton id={id} action={action} onDismiss={onDismiss} />
      )}
      <ToastCloseButton id={id} describedBy={messageId} closeRef={closeRef} onDismiss={onDismiss} />
    </Box>
  );
});

export default UIToast;
