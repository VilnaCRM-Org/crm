import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

export default {
  authOptionsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // The row carries the checkbox and the forgot-password link; wrapping keeps both within a
    // 320px viewport under the WCAG 1.4.12 text-spacing overrides, and the column gap guarantees
    // the 2.5.8 spacing exception the inline link relies on.
    flexWrap: 'wrap',
    columnGap: '1rem',
    rowGap: '0.5rem',
    marginTop: '1rem',
    marginBottom: '0.4375rem',

    [`@media (min-width:375px)`]: {
      paddingRight: '0.75rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.4375rem',
      marginBottom: '-0.5625rem',
      paddingRight: 0,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '-0.625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginTop: '-0.1875rem',
      marginBottom: 0,
    },
  },

  rememberMeLabel: {
    margin: 0,

    '& .MuiFormControlLabel-label': {
      fontFamily: `Inter, sans-serif`,
      fontStyle: 'normal',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.2857',
      letterSpacing: 0,

      color: customColors.text.primary,

      [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
        fontSize: '1rem',
        lineHeight: '1.125',
      },
      [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
        fontSize: '0.875rem',
        lineHeight: '1.2857',
      },
    },

    '& .MuiCheckbox-root .ui-checkbox-box': {
      width: '1.25rem',
      height: '1.25rem',

      [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
        width: '1.5rem',
        height: '1.5rem',
      },
    },
  },
};
