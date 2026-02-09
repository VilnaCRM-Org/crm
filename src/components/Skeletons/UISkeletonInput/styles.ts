import {
  SMALL_MOBILE_BREAKPOINT,
  baseSkeletonStyle,
} from '@/components/Skeletons/base/styles';
import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  inputContainer: {
    position: 'relative',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    height: 'clamp(3rem, 4vw, 4rem)',
    width: '100%',
    ...baseSkeletonStyle,
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '1px',
      borderRadius: 'calc(0.5rem - 1px)',
      backgroundColor: '#FFFFFF',
    },
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      minWidth: '19.6875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '4.9375rem',
      minWidth: '33.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      minWidth: '26.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxHeight: '4rem',
    },
  },
  inputPlaceholder: {
    ...baseSkeletonStyle,
    position: 'absolute',
    zIndex: 1,
    width: '147px',
    height: '18px',
    left: '25px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderRadius: '57px',
  },
};
