import { Box } from '@mui/material';
import { type JSX, useEffect, useState } from 'react';

import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import type { RecoveryResultViewProps } from '@auth/types/password-recovery/components';

import InCardLink from './in-card-link';
import styles from './styles';

export default function RecoveryResultView({
  title,
  body,
  action,
}: RecoveryResultViewProps): JSX.Element {
  const focusOnMount = useFocusOnMount<HTMLElement>();
  const [announcedBody, setAnnouncedBody] = useState('');

  useEffect(() => {
    setAnnouncedBody(body);
  }, [body]);

  return (
    <>
      <UITypography component="h1" ref={focusOnMount} tabIndex={-1} sx={styles.resultTitle}>
        {title}
      </UITypography>
      <Box role="status" aria-live="polite">
        <UITypography sx={styles.resultBody}>{announcedBody}</UITypography>
      </Box>
      <InCardLink to={action.to} variant="contained" sx={styles.resultAction}>
        {action.label}
      </InCardLink>
    </>
  );
}
