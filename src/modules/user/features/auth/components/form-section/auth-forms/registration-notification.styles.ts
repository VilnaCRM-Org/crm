import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';

const ENTRY_ANIMATION = 'notificationFadeInUp 380ms cubic-bezier(0.22, 1, 0.36, 1) both';

export default {
  notificationSection: {
    position: 'absolute',
    inset: 0,
    backgroundColor: paletteColors.background.default,
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    '@keyframes notificationFadeInUp': {
      from: {
        opacity: 0,
        transform: 'translateY(0.875rem)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    '@keyframes notificationConfettiReveal': {
      from: {
        opacity: 0,
        transform: 'translateY(-0.5rem) scale(0.95)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      },
    },
    '@keyframes notificationGearSpinIn': {
      from: {
        opacity: 0,
        transform: 'scale(0.9) rotate(-12deg)',
      },
      to: {
        opacity: 1,
        transform: 'scale(1) rotate(0deg)',
      },
    },
    '@keyframes notificationErrorReveal': {
      from: {
        opacity: 0,
        transform: 'translateY(-0.5rem) scale(0.92)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      },
    },
    '@keyframes notificationFadeOutDown': {
      from: {
        opacity: 1,
        transform: 'translateY(0)',
      },
      to: {
        opacity: 0,
        transform: 'translateY(0.75rem)',
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': {
        animation: 'none !important',
      },
    },
  },
  notificationSectionClosing: {
    animation: 'notificationFadeOutDown 240ms cubic-bezier(0.4, 0, 0.2, 1) both',
  },
  closeButton: {
    position: 'absolute',
    top: '1.25rem',
    right: '1.25rem',
    zIndex: 101,
    color: '#A6ADB4',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      top: '1.5rem',
      right: '1.5rem',
    },
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
    animation: ENTRY_ANIMATION,
    '@media (max-width: 374px)': {
      justifyContent: 'flex-start',
      paddingTop: '40%',
    },
  },
  successTopImgBox: {
    position: 'absolute',
    top: 0,
    left: '-7rem',
    zIndex: 5,
    pointerEvents: 'none',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      top: 0,
      left: '0rem',
      transform: 'scale(1.03)',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      top: 0,
      left: 0,
      transform: 'scale(1)',
    },
  },
  successTopConfetti: {
    display: 'block',
    animation: 'notificationConfettiReveal 520ms cubic-bezier(0.22, 1, 0.36, 1) 90ms both',
  },
  bottomImgBox: {
    position: 'absolute',
    display: 'none',
    left: '-8.75rem',
    bottom: '-8.25rem',
    zIndex: 1,
    opacity: 0.6,
    pointerEvents: 'none',
    transform: 'rotate(-180deg) scale(0.9)',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      display: 'block',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      left: '-8.5rem',
      bottom: '-8rem',
    },
  },
  successBottomConfetti: {
    display: 'block',
    animation: 'notificationConfettiReveal 560ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both',
  },
  gears: {
    zIndex: 6,
  },
  successGears: {
    display: 'block',
    width: '10.25rem',
    height: '10.25rem',
    maxWidth: '100%',
    animation: 'notificationGearSpinIn 600ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      width: '13.375rem',
      height: '13.375rem',
    },
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 20,
    animation: 'notificationFadeInUp 420ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      width: '100%',
    },
  },
  successTextGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  successMessageTitle: {
    fontWeight: 700,
    fontSize: '1.375rem',
    lineHeight: '1.65rem',
    color: customColors.text.primary,
    textTransform: 'none',
    letterSpacing: 0,
    whiteSpace: 'nowrap',
    [`@media (min-width:641px)`]: {
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
    color: customColors.text.primary,
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
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
    color: customColors.text.primary,
    textTransform: 'none',
    letterSpacing: 0,
    [`@media (min-width:641px)`]: {
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
    color: customColors.text.primary,
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1.2rem',
      lineHeight: '1.625rem',
    },
  },
  messageButton: {
    width: '15rem',
    maxWidth: '100%',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      width: '18.8125rem',
    },
    marginTop: '1rem',
    height: '3.125rem',
    minHeight: '3.125rem',
    borderRadius: '3.5625rem',
    textTransform: 'none',
    boxShadow: 'none',
    whiteSpace: 'nowrap',
    color: '#FFFFFF',
    '&:visited, &:hover, &:active, &:focus-visible': {
      color: '#FFFFFF',
    },
    '&.MuiButton-contained': {
      padding: '1rem 1.5rem',
      height: '3.125rem',
      minHeight: '3.125rem',
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: '1.125rem',
      color: '#FFFFFF',
    },
    '&.MuiButton-contained:visited, &.MuiButton-contained:hover, &.MuiButton-contained:active, &.MuiButton-contained:focus-visible':
      {
        color: '#FFFFFF',
      },
    '& .MuiTypography-root': {
      color: '#FFFFFF',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.5rem',
      width: '16.625rem',
      height: '4.375rem',
      minHeight: '4.375rem',
      '&.MuiButton-contained': {
        padding: '1.25rem 2.75rem',
        height: '4.375rem',
        minHeight: '4.375rem',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: '1.35rem',
      },
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      width: '15.125rem',
      height: '3.875rem',
      minHeight: '3.875rem',
      '&.MuiButton-contained': {
        padding: '1.25rem 2rem',
        height: '3.875rem',
        minHeight: '3.875rem',
      },
    },
  },

  contentBoxError: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '0.5rem 0.875rem 0.875rem',
    animation: ENTRY_ANIMATION,
    '@media (max-width: 374px)': {
      justifyContent: 'flex-start',
      paddingTop: '1rem',
    },
    [`@media (min-width:641px)`]: {
      padding: '0.5rem 1rem 0.75rem',
    },
  },
  errorImage: {
    display: 'block',
    width: '16.75rem',
    height: '12.1875rem',
    maxWidth: '100%',
    animation: 'notificationErrorReveal 460ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both',
  },
  imageWrapperError: {
    marginBottom: '0.8125rem',
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      marginBottom: '0.75rem',
    },
  },
  messageContainerError: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
    animation: 'notificationFadeInUp 420ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both',
    [`@media (min-width:334px) and (max-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      padding: '0rem 0.6rem',
    },
    [`@media (min-width:1131px)`]: {
      padding: '0rem 1.2rem',
    },
  },
  buttonsBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    marginTop: '1rem',
    animation: 'notificationFadeInUp 460ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both',
    '@media (min-width: 641px)': {
      marginTop: '2rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1rem',
    },
  },
  errorButton: {
    width: '100%',
    height: '50px',
    minWidth: '260px',
    boxSizing: 'border-box',
    borderRadius: '3.5625rem',
    boxShadow: 'none',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: '1.125rem',
    '&.MuiButton-contained, &.MuiButton-outlined': {
      height: '50px',
      padding: '0 1rem',
    },
    '@media (min-width: 375px)': {
      minWidth: '301px',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
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
  errorButtonSecondary: {
    marginTop: '0.5rem',
  },
  loader: {
    position: 'absolute',
    top: '38%',
    left: '42%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
  },
} as const;
