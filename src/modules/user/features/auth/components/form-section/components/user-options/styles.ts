import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors } from '@/styles/colors';

export default {
  authOptionsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.4375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '0.8125rem',
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
      [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
        fontSize: '0.875rem',
        lineHeight: '1.2857',
      },
    },
  },

  rememberMeCheckbox: {
    padding: 0,
    marginRight: '0.8125rem',
  },
};
