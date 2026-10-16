import Box from '@mui/material/Box';
import { type JSX, useRef } from 'react';

import type { UIToastStackProps } from '@/components/types/ui-toast';
import UILiveStatus from '@/components/ui-live-status';

import styles from './styles';
import UIToast from './ui-toast';
import useStackClearance from './use-stack-clearance';
import useToastFocus from './use-toast-focus';

export default function UIToastStack({
  toasts,
  announcement,
  alert,
  onDismiss,
  returnFocusRef,
  fallbackFocusRef,
}: UIToastStackProps): JSX.Element {
  const stackRef = useRef<HTMLDivElement>(null);
  useStackClearance(stackRef, toasts.items.length);
  const { closeRef, dismiss } = useToastFocus({
    toasts,
    returnFocusRef,
    fallbackFocusRef,
    onDismiss,
  });

  return (
    <>
      <UILiveStatus message={announcement} />
      <UILiveStatus message={alert} politeness="assertive" />
      {toasts.items.length > 0 && (
        <Box ref={stackRef} sx={styles.stack}>
          {toasts.items.map((toast) => (
            <UIToast key={toast.id} ref={closeRef(toast.id)} toast={toast} onDismiss={dismiss} />
          ))}
        </Box>
      )}
    </>
  );
}
