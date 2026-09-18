import { Box } from '@mui/material';
import { forwardRef, type JSX } from 'react';

import type { UIOfflineNoticeProps } from '@/components/types/ui-offline-notice';
import UITypography from '@/components/ui-typography';

import styles from './styles';
import useOfflineNotice from './use-offline-notice';

// The status region is always mounted and only its text changes: a live region that is
// created and filled in the same commit is dropped by most screen readers, whereas a text
// change inside an existing one is announced (issue #147). It is focusable by script only, so a
// form can park keyboard focus here when the control that held it becomes disabled.
const UIOfflineNotice = forwardRef<HTMLDivElement, UIOfflineNoticeProps>(function UIOfflineNotice(
  { online, id },
  ref
): JSX.Element {
  const message = useOfflineNotice(online);

  return (
    <Box
      ref={ref}
      id={id}
      role="status"
      aria-atomic="true"
      tabIndex={-1}
      sx={message ? styles.notice : styles.empty}
    >
      {message && <UITypography sx={styles.text}>{message}</UITypography>}
    </Box>
  );
});

export default UIOfflineNotice;
