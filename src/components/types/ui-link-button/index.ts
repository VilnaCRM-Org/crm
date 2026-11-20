import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import type { ReactNode } from 'react';

export interface UILinkButtonProps {
  children: ReactNode;
  onClick: () => void;
  unavailable?: boolean | undefined;
  describedBy?: string | undefined;
  sx?: SystemStyleObject<Theme> | undefined;
}
