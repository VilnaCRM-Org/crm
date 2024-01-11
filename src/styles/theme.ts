import { createTheme } from '@mui/material/styles';

import Golos from '@/assets/fonts/golos/Golos-Text_Black.ttf';
import Inter from '@/assets/fonts/inter/Inter-Black.ttf';

export default createTheme({
  palette: {
    primary: {
      main: '#1EAEFF',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC3939',
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Golos, Inter',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: Golos;
          src:
            local('Golos')
            url(${Golos}) format('ttf')
        }
        @font-face {
          font-family: Golos;
          src:
            local('Golos')
            url(${Inter}) format('ttf')
        }
      `,
    },
  },
});