import useMediaQuery from '@mui/material/useMediaQuery';

const MOTION_MS = 200;

export default function useDrawerMotion(): number {
  return useMediaQuery('(prefers-reduced-motion: reduce)') ? 0 : MOTION_MS;
}
