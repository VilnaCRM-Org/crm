export const paletteColors = {
  primary: {
    main: '#1EAEFF',
    hover: '#00A3FF',
    active: '#0399ED',
    linkHover: '#297FFF',
    // Link text on the #FFFFFF form background: 5.04:1 and 7.60:1. WCAG 1.4.3 AA needs 4.5:1,
    // which `main` (2.46:1), `linkHover` (3.77:1) and `active` (3.10:1) do not reach.
    linkText: '#0074B5',
    linkTextHover: '#00588A',
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
    dark: '#1A1C1E',
  },
  checkbox: {
    main: '#D0D4D8',
  },
} as const;
