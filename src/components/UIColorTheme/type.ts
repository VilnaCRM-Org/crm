import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      social: {
        icon: string;
        iconHover: string;
      };
      border: {
        default: string;
        focus: string;
      };
      shadow: {
        subtle: string;
      };
      decorative: {
        divider: string;
      };
    };
  }

  interface PaletteOptions {
    custom?: {
      social?: {
        icon?: string;
        iconHover?: string;
      };
      border?: {
        default?: string;
        focus?: string;
      };
      shadow?: {
        subtle?: string;
      };
      decorative:{
        divider?: string;
      };
    };
  }
}
