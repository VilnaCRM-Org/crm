import { Box } from '@mui/material';
import type { JSX } from 'react';

import type { ErrorBannerProps } from '@/components/types/ui-form';
import styles from '@/components/ui-form/styles';
import UILinkButton from '@/components/ui-link-button';
import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';

export default function ErrorBanner({
  error,
  action,
  focusReturn,
  unavailableReasonId,
}: ErrorBannerProps): JSX.Element | null {
  const focusOnAppear = useFocusOnMount<HTMLElement>();

  if (!error) return null;
  return (
    <Box
      component="section"
      ref={focusOnAppear}
      tabIndex={-1}
      sx={styles.errorBannerFocus}
      onFocus={focusReturn.onFocus}
      onBlur={focusReturn.onBlur}
    >
      <UITypography role="alert" sx={styles.errorText}>
        {error}
      </UITypography>
      {action && (
        <UILinkButton
          onClick={action.onClick}
          unavailable={unavailableReasonId !== undefined}
          describedBy={unavailableReasonId}
        >
          {action.label}
        </UILinkButton>
      )}
    </Box>
  );
}
