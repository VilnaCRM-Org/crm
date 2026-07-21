import { keyframes } from '@emotion/react';

import { paletteColors } from '@/styles/colors';

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export default {
  wrapper: {
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Matches the shipped loader design (Figma node 439:19256): a grey #E1E7EA pill with the
  // same 57px radius and padding as the disabled/loading submit button, wrapping a white
  // spinner. A dependency-free CSS ring (not MUI CircularProgress) keeps the fallback out of
  // the eager bundle — it renders before any route chunk loads, so its weight is initial-load
  // weight (issue #117). White-on-#E1E7EA (1.26:1) is the design-owner-accepted 1.4.11
  // deviation already documented for the submit loader; the loading state is announced via the
  // visually-hidden live region.
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paletteColors.background.subtle,
    borderRadius: '57px',
    padding: '20px 32px',
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.35)',
    borderTopColor: paletteColors.background.default,
    animation: `${spin} 0.9s linear infinite`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
};
