import { createTheme } from '@mui/material/styles';

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
});
