export default {
  uiGridTop: {
    paddingTop: '8px',
    paddingBottom: '3px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E1E7EA',
  },
  uiLogoContainer: {
    marginTop: '5px',
    marginLeft: '7.7rem',
    '@media (max-width: 1024px)': {
      marginLeft: '1.9rem',
    },
    '@media (max-width: 768px)': {
      marginLeft: '0.7rem',
    },
    '@media (max-width: 341px)': {
      marginLeft: '0',
      flexDirection: 'column',
      textAlign: 'center',
    },
  },
  uiLogo: {
    '@media (max-width: 341px)': {
      marginRight: '13px',
    },
  },
  uiPolicyContainer: {
    marginRight: '6.65rem',
    marginTop: '0.5rem',
    '@media (max-width: 1024px)': {
      marginRight: '0.4rem',
    },
  },
  uiPolicyItem: {
    width: '100%',
    paddingTop: '3px',
  },
  uiLinkTypography: {
    backgroundColor: '#F4F5F6',
    padding: '15px 16px',
    borderRadius: '8px',
    margin: '1px 9px 0 15px',
    textAlign: 'center',
    letterSpacing: '0',
  },
  uiGridBottom: {
    backgroundColor: '#F4F5F6',
    borderRadius: '16px 16px 0 0',
    paddingTop: '10px',
    paddingBottom: '10px',
  },
  uiCopyrightContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: '7px',
    '@media (max-width: 1024px)': {},
  },
  uiCopyrightTypography: {
    padding: '15px',
    textAlign: 'center',
  },
  uiSocialLinksContainer: {
    width: '100%',
    textAlign: 'center',
  },
  uiSocialLinks: {
    marginTop: '6px',
    marginRight: '11px',
    '@media (max-width: 320px)': {
      marginTop: '0',
      marginRight: '0',
    },
  },
  uiEmailLink: {
    marginTop: '2px',
    height: '33px',
    border: '1px solid #E1E7EA',
    borderRadius: '8px',
    padding: '5px 16px 8px 16px',
    color: 'black',
    backgroundColor: '#FFFFFF',
    marginRight: '13px',
  },
  uiEmail: {
    border: '1px solid #E1E7EA',
    borderRadius: '8px',
    padding: '12px 0',
    marginLeft: '15px',
    marginRight: '9px',
    fontSize: '18px',
    letterSpacing: '0.1px',
  },
};
