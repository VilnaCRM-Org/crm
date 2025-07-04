import breakpointsTheme from '@/components/UIBreakpoints';
import colorTheme from '@/components/UIColorTheme';

const centeredFlex = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
export default {
  footerDesktopWrapper: {
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  },
  footerBranding: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '15px',
    },
  },

  uiInfoWrapper: {
    textAlign: 'center',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'flex',
    },
  },

  uiEmailLink: {
    display: 'block',

    paddingTop: '0.9375rem',
    paddingBottom: '1rem',

    fontWeight: 600,
    fontFamily: 'Golos',
    fontSize: '1.125rem',
    lineHeight: '100%',
    letterSpacing: '0',

    color: '#1B2327',
    border: `1px solid ${colorTheme.palette.grey[50]}`,
    borderRadius: '8px',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'none',
    },
  },

  uiLinkTypography: {
    ...centeredFlex,

    fontWeight: 500,
    fontFamily: 'Golos',
    fontSize: '1rem',
    lineHeight: '1.125rem',

    paddingTop: '1.0625rem',
    paddingBottom: '1.125rem',
    marginTop: '0.25rem',

    textAlign: 'center',
    letterSpacing: '0',

    borderRadius: '8px',
    backgroundColor: colorTheme.palette.grey[100],

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      padding: '0.5rem 1rem',
      marginTop: '0rem',

      '&:not(:last-of-type)': {
        marginRight: '0.5rem',
      },
    },
  },

  uiCopyrightTypography: {
    fontWeight: 500,
    fontFamily: 'Golos',
    fontSize: ' 0.94rem',
    lineHeight: '1.125rem',

    paddingTop: '1rem',
    paddingBottom: '1.25rem',
    textAlign: 'center',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'none',
    },
  },
};
