import breakpointsTheme from '@/components/UIBreakpoints';
import { customColors } from '@/styles/colors';

export default {
  formFieldWrapper: {
    '&:nth-of-type(-n+2)': {
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
  },

  formFieldLabel: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.29,
    letterSpacing: 0,

    marginBottom: '0.25rem',

    color: customColors.text.primary,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1rem',
      lineHeight: 1.125,
      letterSpacing: 0,
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontSize: '0.875rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      fontSize: '1rem',
      lineHeight: '1.125',

      marginBottom: '0.5625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.2857,
    },
  },

  formFieldInput: {
    [`@media (min-width:375px)`]: {
      minWidth: '19.6875rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      minWidth: '33.75rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      minWidth: '26.375rem',
    },
  },

  passwordButton: {
    marginInlineEnd: 0,
  },

  passwordField: {
    paddingRight: '0.5625rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingRight: '0.875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      paddingRight: '0.9375rem',
    },
  },
  passwordIcon: {
    width: '1.5rem',
    height: '1.5rem',
  },
};
