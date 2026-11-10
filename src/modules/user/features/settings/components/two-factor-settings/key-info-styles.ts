import { customColors, paletteColors } from '@/styles/colors';

import { SETTINGS_DESKTOP, SETTINGS_FOCUS_RING, SETTINGS_TABLET } from '../profile-form/styles';

const FIGMA_DESKTOP = '@media (min-width:1440px)';

const POSITIONER = {
  position: 'absolute',
  zIndex: 2,
  left: 0,
  right: 0,
  bottom: '100%',
  [SETTINGS_TABLET]: {
    left: '8.9375rem',
    right: 'auto',
    width: 'min(23.3125rem, calc(100% - 8.9375rem))',
    bottom: 'calc(100% - 0.625rem)',
    paddingBottom: '0.4375rem',
  },
  [SETTINGS_DESKTOP]: {
    left: 'auto',
    right: 0,
    width: 'min(20.875rem, 100%)',
    bottom: 'calc(100% - 0.5625rem)',
    paddingBottom: '0.5625rem',
  },
  [FIGMA_DESKTOP]: { left: '7.6875rem', right: 'auto', width: '20.875rem' },
};

export default {
  anchor: { flexShrink: 0, display: 'inline-flex' },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem',
    padding: 0,
    border: 0,
    borderRadius: '50%',
    backgroundColor: 'transparent',
    color: customColors.text.muted,
    cursor: 'pointer',
    '&:focus-visible': SETTINGS_FOCUS_RING,
  },
  icon: {
    display: 'block',
    width: '1.5rem',
    height: '1.5rem',
    fill: 'none',
    [SETTINGS_DESKTOP]: { width: '1.25rem', height: '1.25rem' },
  },
  open: { ...POSITIONER, visibility: 'visible' },
  closed: { ...POSITIONER, visibility: 'hidden' },
  body: {
    boxSizing: 'border-box',
    padding: '0.75rem 1rem',
    backgroundColor: paletteColors.background.default,
    border: `1px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.5rem',
    boxShadow: '0 7px 6px rgba(201, 206, 208, 0.41)',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1rem',
    color: customColors.text.primary,
    [SETTINGS_TABLET]: { fontSize: '1rem', lineHeight: '1.125rem' },
    [SETTINGS_DESKTOP]: { fontSize: '0.875rem', lineHeight: '1rem' },
  },
  arrow: {
    display: 'none',
    width: 0,
    height: 0,
    marginTop: '-1px',
    borderTop: `5px solid ${paletteColors.background.default}`,
    borderInline: '10px solid transparent',
    [SETTINGS_TABLET]: { display: 'block', marginLeft: '11.0625rem' },
    [SETTINGS_DESKTOP]: { display: 'none' },
    [FIGMA_DESKTOP]: { display: 'block', marginLeft: '9.8125rem' },
  },
} as const;
