import breakpointsTheme from '@/components/UIBreakpoints';
import colorTheme from '@/components/UIColorTheme';

export default {
  footerBranding:{
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
      display:'none',
    },
  },
  uiEmail: {
    padding: '12px 0px',

    fontWeight: 600,
    fontFamily: 'Golos',
    fontSize: '18px',
    letterSpacing: '0',

    border: `1px solid ${colorTheme.palette.grey[50]}`,
    borderRadius: '8px',
  },

  uiLinkTypography: {
    fontWeight: 500,
    fontFamily: 'Golos',
    fontSize: '1rem',
    lineHeight: '1.125rem',

    paddingTop: '1.0625rem',
    paddingBottom: '1.125rem',
    marginTop:'0.25rem',

    textAlign: 'center',
    letterSpacing: '0',

    borderRadius: '8px',
    backgroundColor: colorTheme.palette.grey[100],
  },

  uiCopyrightTypography: {
    fontWeight: 500,
    fontFamily: 'Golos',
    fontSize:' 0.94rem',
    lineHeight: '1.125rem',

    paddingTop: '1rem',
    paddingBottom: '1.25rem',
    textAlign: 'center',
  },
};
