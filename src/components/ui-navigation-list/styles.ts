import type { NavigationRowId } from '@/components/types/ui-navigation-list';
import { customColors, paletteColors } from '@/styles/colors';

const FONT = 'Inter, sans-serif';

const tabletOverrides: Partial<Record<NavigationRowId, object>> = {
  products: { height: '67px', paddingTop: '1px' },
  settings: { paddingTop: '6px' },
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
  whiteSpace: 'nowrap',
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

const rowBase = { ...control, padding: '0 0 0 24px', gap: '8px' };

const drawerBorder = `1px solid ${paletteColors.background.subtle}`;

const subBase = { ...control, display: 'block', fontWeight: 400, lineHeight: '18px' };

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
    desktop: { ...rowBase, height: '54px', fontSize: '16px', lineHeight: '18px' },
    tablet: { ...rowBase, height: '66px', fontSize: '18px', lineHeight: '22px' },
    drawer: { ...rowBase, height: '60px', fontSize: '16px', lineHeight: '18px' },
  },
  rowById: { desktop: noOverrides, tablet: tabletOverrides, drawer: noOverrides },
  rowOpen: { desktop: noOverrides, tablet: noOverrides, drawer: { height: '48px' } },
  action: { ...rowBase, height: '54px', fontSize: '16px', lineHeight: '18px' },
  actionDrawer: {
    ...rowBase,
    height: '54px',
    padding: '0 0 1px 24px',
    borderTop: drawerBorder,
    fontSize: '16px',
    lineHeight: '18px',
  },
  icon: {
    desktop: { width: '24px', height: '24px' },
    tablet: { width: '28px', height: '28px' },
    drawer: { width: '24px', height: '24px' },
    action: { width: '24px', height: '24px' },
  },
  sub: {
    desktop: { ...subBase, height: '42px', padding: '9px 0 0 56px', fontSize: '16px' },
    tablet: { ...subBase, height: '46px', padding: '8px 0 0 60px', fontSize: '18px' },
    drawer: { ...subBase, height: '42px', padding: '12px 0 0 56px', fontSize: '16px' },
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
