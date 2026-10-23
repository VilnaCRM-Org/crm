import { customColors, paletteColors } from '@/styles/colors';

const NARROWEST = '@media (max-width:374px)';

const ring = {
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.dark}`,
    outlineOffset: '2px',
  },
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

const glyph = { display: 'block', flexShrink: 0, width: '24px', height: '24px' };

export default {
  backdrop: {
    backgroundColor: customColors.shell.scrim,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  dialog: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    outline: 'none',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: '56px',
    padding: '0 15px',
    pointerEvents: 'auto',
    backgroundColor: paletteColors.background.default,
    [NARROWEST]: { padding: '0 8px' },
  },
  logo: { display: 'block', flexShrink: 0, width: '125px', height: '42.067px', marginTop: '7px' },
  cluster: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: '16px',
    width: '160px',
    height: '40px',
    marginTop: '8px',
  },
  glyph: { ...glyph, color: customColors.checkbox.main },
  avatar: { flexShrink: 0, width: '40px', height: '40px' },
  close: {
    ...ring,
    display: 'block',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '44px',
    height: '44px',
    margin: '-10px',
    padding: '10px',
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    color: customColors.text.primary,
    [NARROWEST]: { width: '42px', margin: '-10px -8px -10px -10px', paddingRight: '8px' },
  },
  closeGlyph: glyph,
  panel: {
    position: 'absolute',
    top: '56px',
    right: 0,
    boxSizing: 'border-box',
    width: 'min(313px, calc(100vw - 7px))',
    height: '622px',
    maxHeight: 'calc(100vh - 56px)',
    overflowX: 'hidden',
    overflowY: 'auto',
    pointerEvents: 'auto',
    backgroundColor: paletteColors.background.default,
    boxShadow: customColors.shell.drawerShadow,
  },
  nav: { display: 'block' },
} as const;
