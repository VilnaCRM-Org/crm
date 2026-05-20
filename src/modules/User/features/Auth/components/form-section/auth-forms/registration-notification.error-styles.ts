import breakpointsTheme, { heightBreakpoints } from '@/components/UIBreakpoints';
import { customColors, paletteColors } from '@/styles/colors';

import {
  centeredColumnFlex,
  compactViewport,
  messageButtonText,
  notificationSection,
} from './registration-notification.shared-styles';

const mediumHeightDesktopViewport = [
  `@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`,
  `(max-height:${heightBreakpoints.medium}px)`,
].join(' and ');

const contentBoxError = {
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
} as const;

const errorImage = {
  display: 'block',
  width: '16.75rem',
  height: '12.1875rem',
  maxWidth: '100%',
} as const;

const imageWrapperError = {
  paddingBottom: '0.25rem',
  marginBottom: '0.8125rem',
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    marginBottom: '0.75rem',
  },
  [compactViewport]: {
    marginBottom: '0.25rem',
    paddingBottom: 0,
  },
} as const;

const messageContainerError = {
  ...centeredColumnFlex,
  textAlign: 'center',
  [`@media (max-width:${breakpointsTheme.breakpoints.values.md - 1}px)`]: {
    padding: '0rem 0.6rem',
  },
  '@media (min-width: 1131px)': {
    padding: '0rem 1.2rem',
  },
} as const;

const buttonsBox = {
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
} as const;

const errorButtonContained = {
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
} as const;

const errorButtonOutlined = {
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
} as const;

const errorButton = {
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
  '&.MuiButton-contained': errorButtonContained,
  '&.MuiButton-outlined': errorButtonOutlined,
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
} as const;

const errorButtonMessage = {
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    fontWeight: 600,
    fontSize: '18px',
    lineHeight: '21.6px',
  },
} as const;

const errorButtonSecondary = { marginTop: '0.5rem' } as const;

const messageTitle = {
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
} as const;

const messageDescription = {
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
} as const;

export default {
  notificationSection,
  messageButtonText,
  contentBoxError,
  errorImage,
  imageWrapperError,
  messageContainerError,
  buttonsBox,
  errorButton,
  errorButtonMessage,
  errorButtonSecondary,
  messageTitle,
  messageDescription,
} as const;
