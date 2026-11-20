import { customColors, paletteColors } from '@/styles/colors';
import { focusVisibleRing } from '@/styles/focus-ring';

import { SETTINGS_DESKTOP, SETTINGS_TABLET } from '../profile-form/styles';

const ICON_BOX = { display: 'block', width: '1.25rem', height: '1.25rem' };

const STEP_ROW = { display: 'flex', alignItems: 'flex-start', gap: '1rem' };

const STEP_TEXT_TABLET = {
  maxWidth: '20.125rem',
  fontFamily: 'Golos',
  fontWeight: 600,
  fontSize: '1.125rem',
  lineHeight: '1.375rem',
};

const STEP_TEXT_DESKTOP = { maxWidth: '18.8125rem', fontSize: '1rem', lineHeight: '1.1875rem' };

const STEP_TEXT = {
  margin: 0,
  maxWidth: '15.6875rem',
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '0.875rem',
  lineHeight: '1.125rem',
  color: customColors.text.primary,
  [SETTINGS_TABLET]: STEP_TEXT_TABLET,
  [SETTINGS_DESKTOP]: STEP_TEXT_DESKTOP,
};

export default {
  steps: {
    margin: '0 0 1.25rem',
    padding: '0 0 0 0.125rem',
    listStyle: 'none',
    [SETTINGS_TABLET]: { paddingLeft: '0.25rem' },
    [SETTINGS_DESKTOP]: { paddingLeft: 0 },
  },
  step: {
    position: 'relative',
    marginBottom: '1.0625rem',
    '&:last-of-type': { marginBottom: 0 },
    [SETTINGS_TABLET]: { marginBottom: '1.8125rem' },
    [SETTINGS_DESKTOP]: { marginBottom: '1.3125rem' },
  },
  stepRow: STEP_ROW,
  stepRowWithInfo: { ...STEP_ROW, [SETTINGS_TABLET]: { alignItems: 'center' } },
  stepBody: {
    paddingTop: '0.5625rem',
    paddingLeft: '2.625rem',
    [SETTINGS_TABLET]: { paddingTop: '0.75rem', paddingLeft: '3rem' },
    [SETTINGS_DESKTOP]: { paddingTop: '0.625rem', paddingLeft: '2.5rem' },
  },
  badge: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.625rem',
    height: '1.625rem',
    borderRadius: '2.0625rem',
    backgroundColor: paletteColors.background.subtle,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: '1.125rem',
    color: customColors.text.muted,
    [SETTINGS_TABLET]: { width: '2rem', height: '2rem' },
    [SETTINGS_DESKTOP]: { width: '1.5rem', height: '1.5rem' },
  },
  stepText: STEP_TEXT,
  stepTextBeforeInfo: {
    ...STEP_TEXT,
    maxWidth: '12.5625rem',
    [SETTINGS_TABLET]: { ...STEP_TEXT_TABLET, maxWidth: '15.875rem' },
    [SETTINGS_DESKTOP]: { ...STEP_TEXT_DESKTOP, maxWidth: '14rem' },
  },
  qrFrame: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '13.125rem',
    padding: '1.3125rem',
    marginTop: '0.3125rem',
    marginBottom: '0.5625rem',
    backgroundColor: customColors.surface.page,
    borderRadius: '0.75rem',
    [SETTINGS_TABLET]: {
      maxWidth: '18.5625rem',
      padding: '1.85625rem',
      marginTop: '0.5rem',
    },
    [SETTINGS_DESKTOP]: {
      maxWidth: '15.625rem',
      padding: '1.5625rem',
      marginTop: '1.3125rem',
      marginBottom: '0.5rem',
    },
  },
  keyChip: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    maxWidth: '100%',
    padding: '0.5rem 0.875rem',
    backgroundColor: paletteColors.border.default,
    borderRadius: '0.25rem',
  },
  keyCode: {
    minWidth: 0,
    overflowWrap: 'anywhere',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 'normal',
    color: customColors.text.muted,
  },
  copyIconButton: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    margin: '-0.25rem',
    padding: 0,
    border: 0,
    borderRadius: '0.25rem',
    backgroundColor: 'transparent',
    color: customColors.text.muted,
    cursor: 'pointer',
    ...focusVisibleRing,
  },
  copyIcon: { ...ICON_BOX, fill: 'none' },
  copiedIcon: ICON_BOX,
  copyFailed: {
    margin: '0.5rem 0 0',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1rem',
    color: customColors.text.primary,
  },
  hint: {
    maxWidth: '15.125rem',
    margin: '0.5625rem 0 0',
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1rem',
    color: customColors.text.primary,
    [SETTINGS_TABLET]: { maxWidth: '19.8125rem', marginTop: '0.75rem' },
    [SETTINGS_DESKTOP]: { marginTop: '0.6875rem' },
  },
} as const;
