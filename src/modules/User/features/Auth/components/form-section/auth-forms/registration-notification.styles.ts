import breakpointsTheme, { heightBreakpoints } from '@/components/UIBreakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const compactViewport = [
  `@media (max-width:${breakpointsTheme.breakpoints.values.sm - 1}px)`,
  `and (max-height:${heightBreakpoints.compact}px)`,
].join(' ');
const mediumHeightDesktopViewport = [
  `@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`,
  `and (max-height:${heightBreakpoints.medium}px)`,
].join(' ');

const centeredColumnFlex = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '100%',
} as const;

export default {
  notificationSection: {
    position: 'absolute',
    inset: 0,
    backgroundColor: paletteColors.background.default,
    borderRadius: '16px',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contentBox: {
    zIndex: 3,
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    [compactViewport]: {
      justifyContent: 'flex-start',
    },
  },
  successTopImgBox: {
    position: 'absolute',
    top: '-0.78rem',
    left: '-8.5rem',
    zIndex: 5,
    pointerEvents: 'none',
    [`@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`]: {
      transform: 'scale(0.91)',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      top: '0.6rem',
      left: '0rem',
      transform: 'scale(1.07)',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      top: '0rem',
      left: '-7rem',
      transform: 'scale(1)',
    },
  },
  successTopConfetti: {
    display: 'block',
  },
  bottomImgBox: {
    position: 'absolute',
    bottom: '-0.78rem',
    left: '-11.8rem',
    zIndex: 1,
    transform: 'rotate(-180deg)',
    pointerEvents: 'none',
    [`@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`]: {
      transform: 'rotate(-180deg) scale(0.91)',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      left: '0rem',
      bottom: '0.6rem',
      transform: 'rotate(-180deg) scale(1.07)',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      left: '0rem',
      bottom: '0.1rem',
      transform: 'rotate(-180deg) scale(1)',
    },
  },
  successBottomConfetti: {
    display: 'block',
  },
  gears: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: '2rem',
    zIndex: 6,
    [`@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`]: {
      transform: 'translateX(-50%) scale(0.8)',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      top: '3rem',
    },
  },
  successGears: {
    display: 'block',
    width: '10.25rem',
    height: '10.25rem',
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 20,
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      width: '100%',
    },
    [compactViewport]: {
      paddingTop: '13rem',
    },
  },
  messageButtonText: {
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',
    fontFamily: 'Golos, sans-serif',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: '1.35rem',
    },
  },
  successMessageTitle: {
    fontWeight: 700,
    fontSize: '1.375rem',
    lineHeight: '1.65rem',
    fontFamily: 'Golos, sans-serif',
    color: customColors.text.dark,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
    },
  },
  successMessageDescription: {
    textAlign: 'center',
    marginTop: '0.5rem',
    fontWeight: 400,
    fontSize: '0.98rem',
    lineHeight: '1.5625rem',
    fontFamily: 'Golos, sans-serif',
    color: customColors.text.dark,
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontSize: '1.2rem',
      lineHeight: '1.625rem',
    },
  },

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
  messageButton: {
    minWidth: '260px',
    width: '100%',
    marginTop: '1rem',
    borderRadius: '3.5625rem',
    textTransform: 'none',
    boxShadow: 'none',
    whiteSpace: 'nowrap',
    color: paletteColors.background.default,
    '&:visited, &:hover, &:active, &:focus-visible': {
      color: paletteColors.background.default,
    },
    '&.MuiButton-contained': {
      padding: '1rem 1.438rem',
      color: paletteColors.background.default,
      '&:hover, &:focus-visible': {
        color: paletteColors.background.default,
        boxShadow: '0px 4px 7px 0px rgba(116, 134, 151, 0.17)',
      },
      '&:active': {
        color: paletteColors.background.default,
        boxShadow: '0px 4px 7px 0px rgba(71, 85, 99, 0.21)',
      },
    },
    '& .MuiTypography-root': {
      color: paletteColors.background.default,
    },
    '@media (min-width: 375px)': {
      minWidth: '301px',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.5rem',
      maxWidth: '266px',
      '&.MuiButton-contained': {
        padding: '1.25rem 2rem',
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      maxWidth: '242px',
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
    [mediumHeightDesktopViewport]: {
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
  errorButtonSecondary: {
    marginTop: '0.5rem',
  },
} as const;
