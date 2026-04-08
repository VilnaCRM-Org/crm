import { SxProps, Theme } from '@mui/material';

export interface UISkeletonBlockProps {
  id?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  sx?: SxProps<Theme>;
}
