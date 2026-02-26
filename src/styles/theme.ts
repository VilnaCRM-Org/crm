import { createTheme } from '@mui/material/styles';

import GolosBlack from '@/assets/fonts/golos/Golos-Text_Black.ttf';
import GolosBold from '@/assets/fonts/golos/Golos-Text_Bold.ttf';
import GolosExtraBold from '@/assets/fonts/golos/Golos-Text_ExtraBold.ttf';
import GolosMedium from '@/assets/fonts/golos/Golos-Text_Medium.ttf';
import GolosRegular from '@/assets/fonts/golos/Golos-Text_Regular.ttf';
import GolosSemiBold from '@/assets/fonts/golos/Golos-Text_SemiBold.ttf';
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
          src: local('Golos'), url(${GolosRegular}) format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: Golos;
          src: local('Golos'), url(${GolosMedium}) format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        @font-face {
          font-family: Golos;
          src: local('Golos'), url(${GolosSemiBold}) format('truetype');
          font-weight: 600;
          font-style: normal;
        }
        @font-face {
          font-family: Golos;
          src: local('Golos'), url(${GolosBold}) format('truetype');
          font-weight: 700;
          font-style: normal;
        }
        @font-face {
          font-family: Golos;
          src: local('Golos'), url(${GolosExtraBold}) format('truetype');
          font-weight: 800;
          font-style: normal;
        }
        @font-face {
          font-family: Golos;
          src: local('Golos'), url(${GolosBlack}) format('truetype');
          font-weight: 900;
          font-style: normal;
        }
        @font-face {
          font-family: Inter;
          src: local('Inter'), url(${Inter}) format('truetype');
        }
      `,
    },
  },
});
