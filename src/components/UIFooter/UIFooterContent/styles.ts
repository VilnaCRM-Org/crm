import breakpointsTheme from '@/components/UIBreakpoints';
import { paletteColors } from '@/styles/colors';

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
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '8px',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'none',
    },
  },

  uiLinkTypography: {
    ...centeredFlex,

    '& .MuiTypography-root': {
      fontWeight: 500,
      fontFamily: 'Golos',
      fontSize: '1rem',
      lineHeight: '1.125rem',
      letterSpacing: '0',
    },

    paddingTop: '1.0625rem',
    paddingBottom: '1.125rem',
    marginTop: '0.25rem',

    textAlign: 'center',

    borderRadius: '8px',
    backgroundColor: paletteColors.background.paper,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      padding: '0.5rem 1rem',
      marginTop: '0rem',

      '&:last-of-type': {
        marginLeft: '0.5rem',
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
