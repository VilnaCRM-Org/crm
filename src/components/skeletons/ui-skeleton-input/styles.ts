import { type Theme } from '@mui/material/styles';
import { type SystemStyleObject } from '@mui/system';

import { SMALL_MOBILE_BREAKPOINT, baseSkeletonStyle } from '@/components/skeletons/base/styles';
import breakpointsTheme from '@/components/UIBreakpoints';

export const BASE_INPUT_HEIGHT = 3;
export const MD_INPUT_HEIGHT = 4.9375;
export const XL_INPUT_HEIGHT = 4;

export const SKELETON_INPUT_OUTER_BACKGROUND = 'linear-gradient(#fff, #fff)';
export const SKELETON_INPUT_BORDER_GRADIENT =
  'linear-gradient(90deg, rgba(211, 216, 224, 0.78) 0%, rgba(211, 216, 224, 0.598958) 49.13%, rgba(211, 216, 224, 0) 100%)';

export default {
  staticSkeleton: {
    animation: 'none',
    backgroundSize: '100% 100%',
  },
  inputContainer: (theme: Theme): SystemStyleObject<Theme> => ({
    position: 'relative',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    height: `clamp(${BASE_INPUT_HEIGHT}rem, 4vw, ${XL_INPUT_HEIGHT}rem)`,
    width: '100%',
    ...baseSkeletonStyle,
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '1px',
      borderRadius: 'calc(0.5rem - 1px)',
      backgroundColor: theme.palette.background.default,
    },
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      minWidth: '19.6875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: `${MD_INPUT_HEIGHT}rem`,
      minWidth: '33.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      minWidth: '26.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxHeight: `${XL_INPUT_HEIGHT}rem`,
    },
  }),
  inputPlaceholder: {
    ...baseSkeletonStyle,
    position: 'absolute',
    zIndex: 1,
    width: '9.1875rem',
    height: '1.125rem',
    left: '1.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    borderRadius: '3.5625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      left: '1.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      left: '1.6875rem',
    },
  },
};
