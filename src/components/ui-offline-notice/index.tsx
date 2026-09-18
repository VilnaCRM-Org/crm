import { Box } from '@mui/material';
import { forwardRef, type JSX } from 'react';

import type { UIOfflineNoticeProps } from '@/components/types/ui-offline-notice';
import UITypography from '@/components/ui-typography';

import styles from './styles';
import useOfflineNotice from './use-offline-notice';

// The status region is always mounted and only its text changes: a live region that is
// created and filled in the same commit is dropped by most screen readers, whereas a text
// change inside an existing one is announced (issue #147). It is focusable by script only, so a
// form can park keyboard focus here when the control that held it becomes disabled. It renders
// as a block `span`, not a `div`: the auth field wrappers space themselves with
// `:nth-of-type(-n+2)`, and a `div` in front of them would shift that count.
const UIOfflineNotice = forwardRef<HTMLSpanElement, UIOfflineNoticeProps>(function UIOfflineNotice(
  { online, id },
  ref
): JSX.Element {
  const message = useOfflineNotice(online);

  return (
    <Box
      component="span"
      ref={ref}
      id={id}
      role="status"
      aria-atomic="true"
      tabIndex={-1}
      sx={message ? styles.notice : styles.empty}
    >
      {message && (
        <UITypography component="span" sx={styles.text}>
          {message}
        </UITypography>
      )}
    </Box>
  );
});

export default UIOfflineNotice;
