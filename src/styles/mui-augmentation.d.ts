import '@mui/material/styles';

import type { CustomColors } from './colors.types';

declare module '@mui/material/styles' {
  interface Theme {
    customColors: CustomColors;
    customFonts: {
      inter: string;
    };
  }

  interface ThemeOptions {
    customColors?: CustomColors;
    customFonts?: {
      inter?: string;
    };
  }
}
