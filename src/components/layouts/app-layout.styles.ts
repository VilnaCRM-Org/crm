const SIDEBAR_BREAKPOINT = 1024;
const DESKTOP_BREAKPOINT = 1440;

const FROM_SIDEBAR = `@media (min-width:${SIDEBAR_BREAKPOINT}px)`;
const TABLET_ONLY = `${FROM_SIDEBAR} and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`;

const HEADER_HEIGHT = '64px';

const NAV_INSET_TOP = 10;
const NAV_VIEWPORT_GAP = 86;
const NAV_PANEL_HEIGHT = { desktop: 791, tablet: 1142 } as const;
const NAV_PANEL_MAX_HEIGHT = `calc(100vh - ${NAV_VIEWPORT_GAP}px)`;

export default {
  sidebarBreakpoint: SIDEBAR_BREAKPOINT,
  headerHeight: HEADER_HEIGHT,
  frame: {
    flexGrow: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: `${HEADER_HEIGHT} 1fr auto`,
    [FROM_SIDEBAR]: { gridTemplateColumns: 'auto minmax(0, 1fr)' },
  },
  headerSlot: {
    gridColumn: '1 / -1',
    gridRow: '1 / -1',
    alignSelf: 'start',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    boxSizing: 'border-box',
    height: HEADER_HEIGHT,
  },
  navSlot: { gridColumn: 1, gridRow: 2 },
  navInsetTop: `${NAV_INSET_TOP}px`,
  navPanel: {
    desktop: { height: `${NAV_PANEL_HEIGHT.desktop}px`, maxHeight: NAV_PANEL_MAX_HEIGHT },
    tablet: { height: `${NAV_PANEL_HEIGHT.tablet}px`, maxHeight: NAV_PANEL_MAX_HEIGHT },
  },
  navPlaceholder: {
    display: 'none',
    width: '250px',
    height: `${NAV_INSET_TOP + NAV_PANEL_HEIGHT.desktop}px`,
    maxHeight: `calc(100vh - ${NAV_VIEWPORT_GAP - NAV_INSET_TOP}px)`,
    [FROM_SIDEBAR]: { display: 'block' },
    [TABLET_ONLY]: { width: '251px', height: `${NAV_INSET_TOP + NAV_PANEL_HEIGHT.tablet}px` },
  },
  main: {
    gridColumn: 1,
    gridRow: 2,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    // The landmark is focusable only so the post-login redirect can land on it. Suppress the ring
    // for that programmatic case, never for a keyboard user who tabs into it.
    '&:focus:not(:focus-visible)': { outline: 'none' },
    [FROM_SIDEBAR]: { gridColumn: 2 },
  },
  footerArea: { gridColumn: '1 / -1', gridRow: 3 },
  footerSlot: { minHeight: '4.125rem' },
} as const;
