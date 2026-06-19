import type { customColors, paletteColors } from './colors';

export type CustomColors = typeof customColors;

export type PaletteColorKey = keyof typeof paletteColors;
export type PaletteColorValue = (typeof paletteColors)[PaletteColorKey];
