import {
  SKELETON_BORDER_COLOR,
  SMALL_MOBILE_BREAKPOINT,
  SMALL_MOBILE_BREAKPOINT_UPPER,
  shadowPulseAnimation,
} from '@/components/Skeletons/base/styles';
import breakpointsTheme from '@/components/UIBreakpoints';
import { fieldGapMargins } from '@/modules/User/features/Auth/components/FormSection/styles';

const AUTH_SKELETON_TINY_BREAKPOINT = '336px';

export default {
  formWrapperPulse: {
    animation: `${shadowPulseAnimation} 1.5s ease-in-out infinite alternate`,
  },
  titleSkeleton: {
    height: '1.375rem',
    marginBottom: '0.5rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      height: '1.875rem',
      width: '10.3125rem',
      marginBottom: '0.9375rem',
    },
  },
  subtitleWrapper: {
    marginBottom: '1.0625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.25rem',
    },
  },
  subtitleFirstLine: {
    height: '1.5625rem',
    [`@media (max-width:${AUTH_SKELETON_TINY_BREAKPOINT})`]: {
      height: '1.375rem',
      width: '100%',
      marginBottom: '0.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      height: '1.625rem',
      width: '18.5rem',
    },
  },
  subtitleSecondLine: {
    display: 'none',
    [`@media (max-width:${AUTH_SKELETON_TINY_BREAKPOINT})`]: {
      display: 'block',
      height: '1.375rem',
    },
  },
  fieldContainer: {
    ...fieldGapMargins,
  },
  fieldLabel: {
    height: '1.125rem',
    marginBottom: '0.25rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      // 0.875rem (md font-size) × 1.125 (sm line-height cascade) = 0.984375rem
      height: '0.984375rem',
      marginBottom: '0.25rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      height: '1.125rem',
      marginBottom: '0.5625rem',
    },
  },
  lastFieldContainer: {
    marginBottom: 0,
  },
  buttonSkeleton: {
    marginTop: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '2.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '2.0625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '1.1875rem',
    },
  },
  dividerText: {
    width: '1.86rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      width: '2.23rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      width: '1.86rem',
    },
  },
  divider: {
    marginTop: '1.0625rem',
    marginBottom: '0.875rem',
    '& .MuiDivider-wrapper': {
      padding: '0 1.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.5rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.5625rem',
      marginBottom: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '0.875rem',
      marginBottom: '1.5rem',
    },
  },
  socialContainer: {
    display: 'block',
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
    },
  },
  socialButton: {
    border: `1px solid ${SKELETON_BORDER_COLOR}`,
    borderRadius: '0.75rem',
    height: '3.625rem',
    width: '100%',
    marginBottom: '1rem',
    '&:last-child': {
      marginBottom: 0,
    },
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT}px)`]: {
      maxWidth: '9.625rem',
      marginTop: '0.5rem',
      marginBottom: 0,
      '&:nth-of-type(2n+1)': {
        marginRight: '0.3rem',
      },
      '&:nth-of-type(-n+2)': {
        marginTop: 0,
      },
      '&:last-child': {
        marginBottom: 0,
      },
    },
    [`@media (min-width:${SMALL_MOBILE_BREAKPOINT_UPPER}px)`]: {
      height: '4.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      maxWidth: '8.0625rem',
      height: '5.375rem',
      margin: 0,
      '&:nth-of-type(2n+1)': {
        margin: 0,
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      height: '4.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxWidth: '6.25rem',
      height: '3.75rem',
    },
  },
  switcherSkeleton: {
    marginTop: '1.4375rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    height: '1.125rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '2.75rem',
      height: '1.35rem',
      width: '17rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '1.5rem',
      height: '1.125rem',
      width: '14rem',
    },
  },
};
