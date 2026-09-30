import { keyframes } from '@emotion/react';

export const shadowPulseAnimation = keyframes`
  0% {
    box-shadow: 0px 7px 20px 0px rgba(211, 216, 224, 0.2);
  }
  100% {
    box-shadow: 0px 7px 60px 0px rgba(211, 216, 224, 0.8);
  }
`;

export const SMALL_MOBILE_BREAKPOINT = 375;

export const SMALL_MOBILE_BREAKPOINT_UPPER = SMALL_MOBILE_BREAKPOINT + 1;

export const SKELETON_BORDER_COLOR = '#E1E7EA';
