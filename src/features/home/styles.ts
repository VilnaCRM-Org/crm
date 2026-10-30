import { customColors } from '@/styles/colors';

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
} as const;
