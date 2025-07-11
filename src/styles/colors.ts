export const paletteColors = {
  primary: {
    main: '#1EAEFF',
  },
  secondary: {
    main: '#FFC01E',
  },
  error: {
    main: '#DC3939',
  },
  success: {
    main: '#4CAF50',
  },
  warning: {
    main: '#FF9800',
  },
  info: {
    main: '#2196F3',
  },
  border: {
    default: '#EAECEE',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F4F5F6',
    subtle: '#E1E7EA',
  },
  shadow: {
    subtle: '#E7E7E77D',
  },
  grey: {
    50: '#969B9D',
  },
} as const;

export const customColors = {
  social: {
    icon: '#1B2327',
    iconHover: '#333333',
  },
  brand: {
    blue: '#1EAEFF',
    yellow: '#FFC01E',
  },
  status: {
    online: '#4CAF50',
    offline: '#9E9E9E',
    busy: '#F44336',
    away: '#FF9800',
  },
  decorative: {
    divider: '#57595B',
  },
  text: {
    primary: '#404142',
    secondary: '#969B9D',
  },
  checkbox: {
    main: '#D0D4D8',
  },
} as const;

export type CustomColors = typeof customColors;

export type PaletteColorKey = keyof typeof paletteColors;
export type PaletteColorValue = (typeof paletteColors)[PaletteColorKey];
