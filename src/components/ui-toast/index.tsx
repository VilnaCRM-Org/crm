import Box from '@mui/material/Box';
import { type JSX, useCallback, useRef } from 'react';

import useNotificationFocus from '@/hooks/use-notification-focus';
import useNotificationViews from '@/hooks/use-notification-views';
import useNotifications from '@/hooks/use-notifications';
import useShownNotifications from '@/hooks/use-shown-notifications';

import styles from './styles';
import UIToast from './ui-toast';
import useStackClearance from './use-stack-clearance';
import useToastFocus from './use-toast-focus';

export default function UIToastStack(): JSX.Element | null {
  const stackRef = useRef<HTMLDivElement>(null);
  const toasts = useNotificationViews(useShownNotifications());
  const focus = useNotificationFocus();
  const port = useNotifications();
  const onDismiss = useCallback((id: string): void => port.dismiss(Number(id)), [port]);
  useStackClearance(stackRef, toasts);
  const { closeRef, dismiss } = useToastFocus({ toasts, focus, onDismiss });

  if (toasts.items.length === 0) return null;

  return (
    <Box ref={stackRef} sx={styles.stack}>
      {toasts.items.map((toast) => (
        <UIToast key={toast.id} ref={closeRef(toast.id)} toast={toast} onDismiss={dismiss} />
      ))}
    </Box>
  );
}
