import { keyframes } from '@emotion/react';

import copyLineTiming from './copy-line-timing';
import setupStepsStyles from './setup-steps-styles';

const fadeOut = keyframes`
  to {
    opacity: 0;
  }
`;

const LINE = { ...setupStepsStyles.copyFailed, margin: 0, overflowWrap: 'anywhere' } as const;

export default {
  slot: { minHeight: '1rem' },
  failedLine: LINE,
  copiedLine: {
    ...LINE,
    animation: `${fadeOut} ${copyLineTiming.fadeMs}ms ease-out ${copyLineTiming.holdMs}ms forwards`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
  },
};
