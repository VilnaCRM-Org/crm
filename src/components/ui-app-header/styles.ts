import { customColors, paletteColors } from '@/styles/colors';

const FONT = 'Inter, sans-serif';
const DISABLED_FILL = paletteColors.background.subtle;
const DISABLED_GLYPH = customColors.checkbox.main;
const FROM_NARROWEST = '@media (max-width:374px)';

const focusRing = {
  outline: `2px solid ${customColors.text.dark}`,
  outlineOffset: '2px',
};

const standaloneFocus = {
  '&:focus-visible': focusRing,
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

const header = {
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  height: '64px',
  flexShrink: 0,
  backgroundColor: paletteColors.background.default,
};

const logoLink = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  ...standaloneFocus,
};

const logoImage = { display: 'block' };

const logoBox = { width: '143px', height: '48.125px' };

const cluster = { display: 'flex', alignItems: 'flex-start', flexShrink: 0 };

const searchBox = {
  position: 'relative',
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: paletteColors.border.default,
};

const searchInput = {
  position: 'absolute',
  inset: 0,
  boxSizing: 'border-box',
  width: '100%',
  height: '100%',
  margin: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  border: 0,
  outline: 'none',
  backgroundColor: 'transparent',
  appearance: 'none',
  cursor: 'default',
  fontFamily: FONT,
  fontWeight: 500,
  lineHeight: '18px',
  color: customColors.text.secondary,
  WebkitTextFillColor: customColors.text.secondary,
  '&::placeholder': { color: customColors.text.secondary, opacity: 1 },
  '&::-webkit-search-cancel-button, &::-webkit-search-decoration': { display: 'none' },
};

const magnifier = {
  position: 'absolute',
  top: '14px',
  left: '14px',
  color: customColors.text.secondary,
};

const iconButton = {
  position: 'relative',
  display: 'block',
  flexShrink: 0,
  padding: 0,
  border: 0,
  borderRadius: '42px',
  overflow: 'visible',
  cursor: 'default',
  fontFamily: FONT,
  backgroundColor: DISABLED_FILL,
  color: DISABLED_GLYPH,
};

const iconGlyph = { position: 'absolute', top: '14px', left: '14px' };

const iconButtonBare = {
  display: 'block',
  flexShrink: 0,
  width: '24px',
  height: '24px',
  padding: 0,
  border: 0,
  cursor: 'default',
  backgroundColor: 'transparent',
  color: DISABLED_GLYPH,
};

export default {
  header: {
    desktop: {
      ...header,
      backgroundColor: customColors.surface.page,
      border: `1px solid ${paletteColors.background.subtle}`,
      padding: '7px 11px 0 31px',
    },
    tablet: { ...header, padding: '0 12px' },
    mobile: { ...header, padding: '0 15px', [FROM_NARROWEST]: { padding: '0 8px' } },
  },
  logoLink: {
    desktop: { ...logoLink, ...logoBox },
    tablet: { ...logoLink, ...logoBox, marginTop: '8px' },
    mobile: { ...logoLink, width: '125px', height: '44px', marginTop: '6px' },
  },
  logoImage: {
    desktop: { ...logoImage, ...logoBox },
    tablet: { ...logoImage, ...logoBox },
    mobile: { ...logoImage, width: '125px', height: '42.067px' },
  },
  cluster: {
    desktop: { ...cluster, gap: '10px' },
    tablet: { ...cluster, gap: '8px', marginTop: '6px' },
    mobile: {
      ...cluster,
      alignItems: 'center',
      gap: '16px',
      width: '160px',
      height: '40px',
      marginTop: '8px',
    },
  },
  search: {
    desktop: { ...searchBox, width: '477px', height: '48px' },
    tablet: { ...searchBox, width: '360px', height: '52px' },
    drawer: { ...searchBox, width: '293px', height: '48px', margin: '13px 10px 0' },
  },
  searchInput: {
    desktop: { ...searchInput, paddingLeft: '44px', fontSize: '14px' },
    tablet: { ...searchInput, paddingLeft: '48px', fontSize: '16px' },
    drawer: { ...searchInput, paddingLeft: '44px', fontSize: '14px' },
  },
  magnifier: {
    desktop: { ...magnifier, width: '20px', height: '20px' },
    tablet: { ...magnifier, width: '24px', height: '24px' },
    drawer: { ...magnifier, width: '20px', height: '20px' },
  },
  iconButton: {
    desktop: { ...iconButton, width: '48px', height: '48px' },
    tablet: { ...iconButton, width: '52px', height: '52px' },
    mobile: iconButtonBare,
  },
  iconGlyph: {
    desktop: { ...iconGlyph, width: '20px', height: '20px' },
    tablet: { ...iconGlyph, width: '24px', height: '24px' },
    mobile: { display: 'block', width: '24px', height: '24px' },
  },
  badge: {
    position: 'absolute',
    top: '30px',
    left: '34px',
    boxSizing: 'border-box',
    width: '18px',
    height: '18px',
    overflow: 'hidden',
    borderRadius: '45px',
    backgroundColor: DISABLED_GLYPH,
    color: paletteColors.background.default,
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: '12px',
    lineHeight: '18px',
    textAlign: 'center',
  },
  slot: {
    desktop: { flexShrink: 0, width: 'max-content', minWidth: '225px', height: '48px' },
    tablet: { flexShrink: 0, width: 'max-content', minWidth: '253px', height: '52px' },
    mobile: { flexShrink: 0, width: '40px', height: '40px' },
  },
  slotPlaceholder: { width: '100%', height: '100%' },
  hidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: '1px',
  },
} as const;
