import { createTheme } from '@mui/material/styles';

import Golos from '@/assets/fonts/golos/Golos-Text_Black.ttf';
import Inter from '@/assets/fonts/inter/Inter-Black.ttf';

import { customColors, paletteColors } from './colors';
import './types';

export default createTheme({
  palette: {
    primary: paletteColors.primary,
    secondary: paletteColors.secondary,
    error: paletteColors.error,
    success: paletteColors.success,
    warning: paletteColors.warning,
    info: paletteColors.info,
    background: paletteColors.background,
    grey: paletteColors.grey,
  },
  customColors,
  typography: {
    fontFamily: 'Golos, sans-serif',
  },
  customFonts: {
    inter: 'Inter, sans-serif',
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
          font-family: Inter;
          src:
            local('Inter')
            url(${Inter}) format('ttf')
        }
      `,
    },
  },
});
