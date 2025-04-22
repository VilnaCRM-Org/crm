import { createTheme } from '@mui/material';

export default createTheme({
  palette: {
    primary: {
      main: '#1A1C1E',
      contrastText: '#1A1C1E',
    }
  },
  typography: {
    body1: {
      fontSize: 14.5,
      color: '#1A1C1E',
      fontWeight: 500,
      letterSpacing: '0.3px',
      fontFamily: 'Golos, Inter',
    },
    steelGray: {
      fontSize: '1rem',
      // fontSize: 14.5,
      color: '#969B9D',
      fontWeight: 400,
      // fontWeight: 500,
      // letterSpacing: '0.3px',
      lineHeight: 1.5,
      fontFamily: 'Golos, Inter',
      letterSpacing: '0.15px',
    }
    // '0.90625rem',
  },
  components: {
    MuiTypography: {
      // variants: {
      //
      // },
      defaultProps: {
        variantMapping: {
          steelGray: 'p',
        },
      },
    }
  }
});
