import { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    medium16: CSSProperties;
    medium15: CSSProperties;
    medium14: CSSProperties;
    regular16: CSSProperties;
    bodyText18: CSSProperties;
    bodyText16: CSSProperties;
    bold22: CSSProperties;
    demi18: CSSProperties;
    button: CSSProperties;
    mobileText: CSSProperties;
  }

  interface TypographyVariantsOptions {
    medium16?: CSSProperties;
    medium15?: CSSProperties;
    medium14?: CSSProperties;
    regular16?: CSSProperties;
    bodyText18?: CSSProperties;
    bodyText16?: CSSProperties;
    bold22?: CSSProperties;
    demi18?: CSSProperties;
    button?: CSSProperties;
    mobileText?: CSSProperties;
  }

  interface Palette {
    darkPrimary: Palette['primary'];
    darkSecondary: Palette['secondary'];
    white: string;
    brandGray: Palette['brandGray'];
    grey200: Palette['grey200'];
    grey250: Palette['grey250'];
    grey300: Palette['grey300'];
    grey400: Palette['grey400'];
    grey500: Palette['grey500'];
    backgroundGrey100: Palette['backgroundGrey100'];
    backgroundGrey200: Palette['backgroundGrey200'];
    backgroundGrey300: Palette['backgroundGrey300'];
    containedButtonHover: Palette['containedButtonHover'];
    containedButtonActive: Palette['containedButtonActive'];
    notchDeskBefore: Palette['notchDeskBefore'];
    notchDeskAfter: Palette['notchDeskAfter'];
    notchMobileBefore: Palette['notchMobileBefore'];
    notchMobileAfter: Palette['notchMobileAfter'];
    textLinkHover?: Palette['textLinkHover'];
    textLinkActive?: Palette['textLinkActive'];
  }

  interface PaletteOptions {
    darkPrimary?: PaletteOptions['primary'];
    darkSecondary?: PaletteOptions['secondary'];
    white?: string;
    brandGray?: PaletteOptions['brandGray'];
    grey200?: PaletteOptions['grey200'];
    grey250?: PaletteOptions['grey250'];
    grey300?: PaletteOptions['grey300'];
    grey400?: PaletteOptions['grey400'];
    grey500?: PaletteOptions['grey500'];
    backgroundGrey100?: PaletteOptions['backgroundGrey100'];
    backgroundGrey200?: PaletteOptions['backgroundGrey200'];
    backgroundGrey300?: PaletteOptions['backgroundGrey300'];
    containedButtonHover?: PaletteOptions['containedButtonHover'];
    containedButtonActive?: PaletteOptions['containedButtonActive'];
    notchDeskBefore?: PaletteOptions['notchDeskBefore'];
    notchDeskAfter?: PaletteOptions['notchDeskAfter'];
    notchMobileBefore?: PaletteOptions['notchMobileBefore'];
    notchMobileAfter?: PaletteOptions['notchMobileAfter'];
    textLinkHover?: PaletteOptions['textLinkHover'];
    textLinkActive?: PaletteOptions['textLinkActive'];
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    medium16: true;
    medium15: true;
    medium14: true;
    regular16: true;
    bodyText18: true;
    bodyText16: true;
    bold22: true;
    demi18: true;
    button: true;
    mobileText: true;
  }
}
