import breakpointsTheme, { heightBreakpoints } from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const compactViewportMaxWidth = breakpointsTheme.breakpoints.values.sm - 1;
const compactViewport =
  `@media (max-width:${compactViewportMaxWidth}px) and ` +
  `(max-height:${heightBreakpoints.compact}px)`;

const mdMin = breakpointsTheme.breakpoints.values.md;
const mdMaxHeight = heightBreakpoints.medium;
const mediumViewport = `@media (min-width:${mdMin}px) and (max-height:${mdMaxHeight}px)`;

const centeredColumnFlex = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '100%',
} as const;

export default {
  messageTitle: {
    position: 'relative',
    zIndex: 21,
    fontWeight: 700,
    fontSize: '1.375rem',
    lineHeight: '1.65rem',
    fontFamily: 'Golos, sans-serif',
    color: customColors.text.dark,
    textTransform: 'none',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
    },
  },
  messageDescription: {
    position: 'relative',
    zIndex: 21,
    textAlign: 'center',
    marginTop: '0.5rem',
    fontWeight: 400,
    fontSize: '0.98rem',
    lineHeight: '1.5625rem',
    fontFamily: 'Golos, sans-serif',
    color: customColors.text.dark,
    maxWidth: '300px',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontSize: '1.2rem',
      lineHeight: '1.625rem',
      maxWidth: 'none',
    },
  },
  contentBoxError: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
    paddingTop: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '4.25rem',
    },
    [mediumViewport]: {
      paddingTop: '1rem',
    },
    [compactViewport]: {
      paddingTop: '0.25rem',
    },
  },
  errorImage: {
    display: 'block',
    width: '16.75rem',
    height: '12.1875rem',
    maxWidth: '100%',
  },
  imageWrapperError: {
    paddingBottom: '0.25rem',
    marginBottom: '0.8125rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '0.75rem',
    },
    [compactViewport]: {
      marginBottom: '0.25rem',
      paddingBottom: 0,
    },
  },
  messageContainerError: {
    ...centeredColumnFlex,
    textAlign: 'center',
    [`@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`]: {
      padding: '0rem 0.6rem',
    },
    '@media (min-width: 1131px)': {
      padding: '0rem 1.2rem',
    },
  },
  buttonsBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: '1rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '2rem',
    },
    [compactViewport]: {
      marginTop: '0.5rem',
    },
  },
  errorButton: {
    width: '100%',
    height: '50px',
    minWidth: '260px',
    boxSizing: 'border-box',
    borderRadius: '3.5625rem',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',
    '&.MuiButton-contained': {
      height: '50px',
      padding: '0 1rem',
      backgroundColor: paletteColors.primary.main,
      color: paletteColors.background.default,
      boxShadow: 'none',
      '&:hover, &:focus-visible': {
        color: paletteColors.background.default,
        boxShadow: '0px 4px 7px 0px rgba(116, 134, 151, 0.17)',
      },
      '&:active': {
        color: paletteColors.background.default,
        boxShadow: '0px 4px 7px 0px rgba(71, 85, 99, 0.21)',
      },
      '&.Mui-disabled': {
        backgroundColor: paletteColors.background.subtle,
        color: paletteColors.background.default,
      },
    },
    '&.MuiButton-outlined': {
      height: '50px',
      padding: '0 1rem',
      color: customColors.social.icon,
      backgroundColor: paletteColors.background.default,
      border: `1px solid ${paletteColors.grey[50]}`,
      '&:hover, &:focus-visible': {
        backgroundColor: paletteColors.border.default,
        border: '1px solid rgba(0,0,0,0)',
      },
      '&:active': {
        border: `1px solid ${paletteColors.border.default}`,
      },
      '&.Mui-disabled': {
        backgroundColor: paletteColors.background.subtle,
        color: paletteColors.background.default,
        border: 'none',
      },
    },
    '@media (min-width: 375px)': {
      minWidth: '301px',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      width: '315px',
      height: '70px',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: '1.35rem',
      '&.MuiButton-contained, &.MuiButton-outlined': {
        height: '70px',
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      width: '291px',
      height: '62px',
      '&.MuiButton-contained, &.MuiButton-outlined': {
        height: '62px',
      },
    },
  },
  errorButtonMessage: {
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontWeight: 600,
      fontSize: '18px',
      lineHeight: '21.6px',
    },
  },
  errorButtonSecondary: { marginTop: '0.5rem' },
} as const;
