import { createTheme } from '@mui/material';

export default createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Golos, Inter',
        },
        contained: {
          backgroundColor: '#1EAEFF',
          borderRadius: '57px',
          padding: '20px 32px',
        },
        outlined: {
          padding: '17px 38px',
          borderRadius: '12px',
          borderColor: '#E1E7EA',
          '@media (max-width: 1024px)': {
            padding: '26px 52px',
          },
          '@media (max-width: 375px)': {
            padding: '17px 65px',
            marginBottom: '8px',
          },
        },
      },
    },
  },
});
