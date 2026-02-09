import { SxProps, Theme } from '@mui/material';

export interface UISkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  sx?: SxProps<Theme>;
  'data-testid'?: string;
}
