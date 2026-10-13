import breakpointsTheme from '@/components/ui-breakpoints';
import UI_BUTTON_PHONE_MEDIA from '@/components/ui-button/phone-media';
import { customColors, paletteColors } from '@/styles/colors';

const { lg } = breakpointsTheme.breakpoints.values;
const signOutPadding = '16px 24px';

export default {
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1rem',
    paddingTop: '2rem',
    paddingBottom: '2rem',
  },
  heading: {
    margin: 0,
    fontFamily: 'Golos, sans-serif',
    fontWeight: 700,
    fontSize: '1.375rem',
    lineHeight: 'normal',
    color: customColors.text.dark,
  },
  description: {
    margin: 0,
  },
  signOut: {
    minHeight: '2.75rem',
    padding: signOutPadding,
    borderRadius: '57px',
    borderColor: paletteColors.grey[50],
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: 1.2,
    textTransform: 'none',
    color: customColors.text.dark,
    '&:focus-visible': {
      outline: `2px solid ${customColors.text.dark}`,
      outlineOffset: '2px',
    },
    [`@media (max-width: ${lg}px)`]: {
      padding: signOutPadding,
    },
    [UI_BUTTON_PHONE_MEDIA]: {
      padding: signOutPadding,
      marginBottom: 0,
    },
  },
} as const;
