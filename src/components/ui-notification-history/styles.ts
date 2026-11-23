import { customColors, paletteColors } from '@/styles/colors';

const FORCED_COLORS = '@media (forced-colors: active)';

const INTER = 'Inter, sans-serif';

const divider = `1px solid ${paletteColors.background.subtle}`;

const white = paletteColors.background.default;

export default {
  heading: {
    margin: 0,
    padding: '18px 16px 15px',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: '22px',
    color: customColors.text.dark,
    [FORCED_COLORS]: { color: 'CanvasText' },
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    borderTop: divider,
    '& > li': { borderBottom: divider },
  },
  row: {
    position: 'relative',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minHeight: '71px',
    padding: '15px 16px',
  },
  unread: { backgroundColor: customColors.surface.page },
  message: {
    fontFamily: INTER,
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '18px',
    color: customColors.text.muted,
    overflowWrap: 'anywhere',
    [FORCED_COLORS]: { color: 'CanvasText' },
  },
  unreadMessage: { fontWeight: 500, color: customColors.text.primary },
  dot: {
    display: 'inline-block',
    marginLeft: '8px',
    verticalAlign: 'middle',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: paletteColors.primary.linkText,
    [FORCED_COLORS]: { backgroundColor: 'CanvasText' },
  },
  time: {
    fontFamily: INTER,
    fontStyle: 'italic',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: '18px',
    color: customColors.text.muted,
    [FORCED_COLORS]: { color: 'CanvasText' },
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
  empty: {
    margin: 0,
    padding: '0 16px 16px',
    fontFamily: 'Golos',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: customColors.text.muted,
    [FORCED_COLORS]: { color: 'CanvasText' },
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    padding: '16px 15px 13px',
    background: `linear-gradient(to top, ${white} 70%, rgba(255, 255, 255, 0))`,
  },
  markAll: {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '3.125rem',
    padding: '14px 21px',
    border: `2px solid ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
    backgroundColor: white,
    cursor: 'pointer',
    fontFamily: INTER,
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '18px',
    color: customColors.brand.darkPrimary,
    '&:hover': { backgroundColor: customColors.surface.page },
    '&:focus-visible': { outline: `2px solid ${customColors.text.dark}`, outlineOffset: '2px' },
    [FORCED_COLORS]: { color: 'ButtonText', border: '2px solid ButtonText' },
  },
} as const;
