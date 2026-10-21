import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const { md } = breakpointsTheme.breakpoints.values;

export default {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.25rem',
    marginBottom: '1.25rem',
    [`@media (min-width:${md}px)`]: {
      alignItems: 'center',
      gap: '3.625rem',
      marginBottom: '1.5rem',
    },
  },
  monogram: {
    position: 'relative',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    backgroundColor: paletteColors.background.subtle,
    color: customColors.text.dark,
    fontFamily: 'Golos',
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1,
    [`@media (min-width:${md}px)`]: {
      width: '6.1875rem',
      height: '6.1875rem',
      fontSize: '2.25rem',
    },
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: '-0.3125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.625rem',
    height: '1.625rem',
    borderRadius: '50%',
    backgroundColor: customColors.brand.blue,
    [`@media (min-width:${md}px)`]: { bottom: 0 },
  },
  badgeIcon: { width: '1rem', height: '1rem' },
  glyph: {
    fontSize: '2rem',
    [`@media (min-width:${md}px)`]: { fontSize: '3rem' },
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3125rem',
    minWidth: 0,
    paddingTop: '0.6875rem',
    [`@media (min-width:${md}px)`]: { paddingTop: 0 },
  },
  greeting: {
    margin: 0,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: '1.125rem',
    color: customColors.text.muted,
  },
  name: {
    margin: 0,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: '1.375rem',
    color: customColors.text.dark,
    overflowWrap: 'anywhere',
    [`@media (min-width:${md}px)`]: {
      fontFamily: 'Golos',
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: '1.625rem',
    },
  },
} as const;
