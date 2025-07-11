import '@mui/material/styles';
import { CustomColors } from './colors';

declare module '@mui/material/styles' {
  interface Theme {
    customColors: CustomColors;
  }
  interface ThemeOptions {
    customColors?: CustomColors;
  }
}
