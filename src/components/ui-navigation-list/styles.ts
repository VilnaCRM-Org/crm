import type { NavigationRowId } from '@/components/types/ui-navigation-list';
import { customColors, paletteColors } from '@/styles/colors';

const FONT = 'Inter, sans-serif';

const tabletOverrides: Partial<Record<NavigationRowId, object>> = {
  products: { minHeight: '67px', paddingTop: '3px' },
  settings: { paddingTop: '8px' },
};

const noOverrides: Partial<Record<NavigationRowId, object>> = {};

export const insetFocus = {
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.dark}`,
    outlineOffset: '-2px',
  },
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

export const control = {
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  width: '100%',
  margin: 0,
  border: 0,
  background: 'transparent',
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
  fontFamily: FONT,
  fontWeight: 500,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  color: customColors.text.primary,
  '& svg': { flexShrink: 0, fill: 'none', color: customColors.text.secondary },
  '&:hover': {
    backgroundColor: paletteColors.background.paper,
    color: customColors.text.dark,
    '& svg': { color: customColors.text.primary },
  },
  '&[aria-current="page"]': {
    backgroundColor: customColors.shell.currentTint,
    color: paletteColors.primary.active,
    '& svg': { color: paletteColors.primary.active },
  },
  ...insetFocus,
};

const rowBase = { ...control, padding: '2px 0 2px 24px', gap: '8px' };

const drawerBorder = `1px solid ${paletteColors.background.subtle}`;

const subBase = { ...control, display: 'block', fontWeight: 400 };

const groupLabelBase = { minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' };

const dividerBase = { height: '1px', margin: '0 0 21px', border: 0 };

export default {
  list: {
    expanded: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      minHeight: 0,
      margin: '0 -1px',
      padding: 0,
      listStyle: 'none',
      overflowY: 'auto',
      scrollPaddingBottom: '76px',
    },
    rail: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      minHeight: 0,
      margin: '0 -1px',
      padding: 0,
      listStyle: 'none',
      overflow: 'visible',
    },
    drawer: { margin: '8px 0 0', padding: 0, listStyle: 'none' },
  },
  item: { position: 'relative', flexShrink: 0, margin: 0, padding: 0, listStyle: 'none' },
  itemDrawer: {
    position: 'relative',
    flexShrink: 0,
    width: '233px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  row: {
    desktop: { ...rowBase, minHeight: '54px', fontSize: '16px', lineHeight: '1.125' },
    tablet: { ...rowBase, minHeight: '66px', fontSize: '18px', lineHeight: 'calc(22 / 18)' },
    drawer: { ...rowBase, minHeight: '60px', fontSize: '16px', lineHeight: '1.125' },
  },
  rowById: { desktop: noOverrides, tablet: tabletOverrides, drawer: noOverrides },
  rowOpen: { desktop: noOverrides, tablet: noOverrides, drawer: { minHeight: '48px' } },
  action: { ...rowBase, minHeight: '54px', fontSize: '16px', lineHeight: '1.125' },
  actionDrawer: {
    ...rowBase,
    minHeight: '54px',
    padding: '2px 0 3px 24px',
    borderTop: drawerBorder,
    fontSize: '16px',
    lineHeight: '1.125',
  },
  icon: {
    desktop: { width: '24px', height: '24px' },
    tablet: { width: '28px', height: '28px' },
    drawer: { width: '24px', height: '24px' },
    action: { width: '24px', height: '24px' },
  },
  sub: {
    desktop: {
      ...subBase,
      minHeight: '42px',
      padding: '9px 0 2px 56px',
      fontSize: '16px',
      lineHeight: '1.125',
    },
    tablet: {
      ...subBase,
      minHeight: '46px',
      padding: '8px 0 4px 60px',
      fontSize: '18px',
      lineHeight: '1',
    },
    drawer: {
      ...subBase,
      minHeight: '42px',
      padding: '12px 0 2px 56px',
      fontSize: '16px',
      lineHeight: '1.125',
    },
  },
  groupLabel: {
    desktop: { ...groupLabelBase, maxWidth: '136px' },
    tablet: { ...groupLabelBase, maxWidth: '131px' },
    drawer: { ...groupLabelBase, maxWidth: '129px' },
  },
  signOutDrawer: { margin: 0, padding: 0, listStyle: 'none' },
  signOut: {
    position: 'sticky',
    bottom: 0,
    flexShrink: 0,
    marginTop: 'auto',
    padding: 0,
    listStyle: 'none',
    backgroundColor: paletteColors.background.default,
  },
  divider: {
    expanded: { ...dividerBase, width: '100%', backgroundColor: paletteColors.background.subtle },
    desktopRail: {
      ...dividerBase,
      width: '74px',
      backgroundColor: paletteColors.background.subtle,
    },
    tabletRail: { ...dividerBase, width: '96px', backgroundColor: paletteColors.background.subtle },
  },
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
