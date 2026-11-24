import SvgIcon from '@mui/material/SvgIcon';
import type { JSX } from 'react';

import type { ToastIconProps } from '@/components/types/ui-toast/toast-focus';

const CIRCLE =
  'M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12' +
  'C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z';

const ICON_PATHS = {
  check: `M7.5 12L10.5 15L16.5 9${CIRCLE}`,
  alert: `M12 8V12M12 16H12.01${CIRCLE}`,
  close: 'M18 6L6 18M6 6L18 18',
} as const;

export default function ToastIcon({ name }: ToastIconProps): JSX.Element {
  return (
    <SvgIcon aria-hidden="true" viewBox="0 0 24 24" fontSize="inherit">
      <path
        d={ICON_PATHS[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
