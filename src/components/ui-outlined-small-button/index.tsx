import UiButton from '@vilnacrm/ui-toolkit/ui-button';
import React from 'react';

import type { OutlinedSmallButtonProps } from '@/components/types/ui-outlined-small-button';

export default function UIOutlinedSmallButton({
  ref,
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
  onClick,
  sx,
  children,
}: OutlinedSmallButtonProps): React.ReactElement {
  return (
    <UiButton
      ref={ref}
      variant="outlined"
      size="small"
      disableRipple
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
      onClick={onClick}
      sx={sx}
    >
      {children}
    </UiButton>
  );
}
