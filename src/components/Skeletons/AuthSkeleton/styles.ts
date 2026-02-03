import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  titleSkeleton: {
    marginBottom: '0.5rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '0.9375rem',
    },
  },
  subtitleSkeleton: {
    marginBottom: '1.0625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      marginBottom: '1rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.25rem',
    },
  },
  fieldContainer: {
    marginBottom: '0.5rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      marginBottom: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '1.4375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginBottom: '1rem',
    },
  },
  fieldLabel: {
    marginBottom: '0.25rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '0.5625rem',
    },
  },
  lastFieldContainer: {
    marginBottom: 0,
  },
  inputSkeleton: {
    borderRadius: '8px',
    height: '3.25rem',
    width: '100%',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
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
      height: '4rem',
    },
  },
  buttonSkeleton: {
    marginTop: '1rem',
    borderRadius: '57px',
    height: '3.125rem',
    width: '100%',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      minWidth: '19.6875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '2.125rem',
      height: '4.375rem',
      minWidth: '33.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '2.0625rem',
      minWidth: '26.375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '1.1875rem',
      height: '3.875rem',
    },
  },
  divider: {
    marginTop: '1.0625rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.5625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '0.8755rem',
    },
  },
  dividerText: {
    width: 180,
  },
  socialContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.3rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      gap: 0,
      alignItems: 'stretch',
    },
  },
  socialButton: {
    borderRadius: '12px',
    width: 'calc(50% - 0.15rem)',
    maxWidth: '9.625rem',
    height: '3.25rem',
    marginBottom: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      marginBottom: '0.5rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      width: '8.0625rem',
      maxWidth: '8.0625rem',
      height: '3.75rem',
      marginBottom: 0,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      width: '6.25rem',
      maxWidth: '6.25rem',
    },
  },
  spacer: {
    height: '2.5rem',
  },
};
