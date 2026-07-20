import { circularProgressClasses } from '@mui/material/CircularProgress';

import { paletteColors } from '@/styles/colors';

export default {
  wrapper: {
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Matches the shipped loader design (Figma node 439:19256): a grey #E1E7EA pill with
  // the same 57px radius and padding as the disabled/loading submit button, wrapping the
  // white spinner. White-on-#E1E7EA (1.26:1) is the design-owner-accepted 1.4.11 deviation
  // already documented for the submit loader; the loading state is announced via the
  // visually-hidden live region below.
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paletteColors.background.subtle,
    borderRadius: '57px',
    padding: '20px 32px',
    '@media (prefers-reduced-motion: reduce)': {
      // MUI animates the root (rotation) and the circle (dash), not the svg slot, so stop
      // motion on the root and every descendant for a real prefers-reduced-motion accommodation.
      [`& .${circularProgressClasses.root}, & .${circularProgressClasses.root} *`]: {
        animation: 'none',
      },
    },
  },
};
