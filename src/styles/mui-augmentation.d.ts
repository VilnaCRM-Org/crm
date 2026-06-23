import '@mui/material/styles';

import type { CustomColors } from '@/styles/types/colors';

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
