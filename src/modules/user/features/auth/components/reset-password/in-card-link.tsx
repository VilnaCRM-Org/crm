import type { JSX } from 'react';
import { useLinkClickHandler } from 'react-router';

import UIButton from '@/components/ui-button';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import type { InCardLinkProps } from '@auth/types/password-recovery/components';

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

export default function InCardLink({ to, variant, sx, children }: InCardLinkProps): JSX.Element {
  const handleClick = useLinkClickHandler<HTMLButtonElement>(to, { state: FOCUS_ON_ARRIVAL });

  return (
    <UIButton to={to} onClick={handleClick} variant={variant} sx={sx} disableRipple>
      {children}
    </UIButton>
  );
}
