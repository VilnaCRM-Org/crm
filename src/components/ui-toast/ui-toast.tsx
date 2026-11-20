import Box from '@mui/material/Box';
import { forwardRef, type JSX, useCallback, useMemo } from 'react';

import type { UIToastProps } from '@/components/types/ui-toast';
import UINotificationContent from '@/components/ui-notification-content';
import type { NotificationView } from '@/lib/notifications/types/notification-view';

import styles from './styles';

const UIToast = forwardRef<HTMLButtonElement, UIToastProps>(function UIToast(
  { toast, onDismiss },
  closeRef
): JSX.Element {
  const { id, kind, action } = toast;
  const view = useMemo(
    (): NotificationView =>
      action === undefined
        ? toast
        : {
            ...toast,
            action: {
              label: action.label,
              onActivate: (): void => {
                onDismiss(id);
                action.onActivate();
              },
            },
          },
    [toast, id, action, onDismiss]
  );
  const close = useCallback((): void => onDismiss(id), [id, onDismiss]);

  return (
    <Box sx={[styles.toast, styles.tones[kind]]}>
      <UINotificationContent view={view} onClose={close} closeRef={closeRef} />
    </Box>
  );
});

export default UIToast;
