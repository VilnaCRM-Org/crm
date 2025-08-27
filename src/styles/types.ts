import '@mui/material/styles';
import { CustomColors } from './colors';

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
