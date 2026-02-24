import { keyframes } from '@emotion/react';

export const shimmerAnimation = keyframes`
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
`;

export const shadowPulseAnimation = keyframes`
  0% {
    box-shadow: 0px 7px 20px 0px rgba(211, 216, 224, 0.2);
  }
  100% {
    box-shadow: 0px 7px 60px 0px rgba(211, 216, 224, 0.8);
  }
`;

export const shimmerGradient = `linear-gradient(
  90deg,
  rgba(211, 216, 224, 0) 0%,
  rgba(211, 216, 224, 0.6) 49.13%,
  rgba(211, 216, 224, 0) 100%
)`;

export const SMALL_MOBILE_BREAKPOINT = 375;

export const SKELETON_BORDER_RADIUS = '57px';

export const SKELETON_BORDER_COLOR = '#E1E7EA';

export const baseSkeletonStyle = {
  backgroundImage: shimmerGradient,
  backgroundSize: '200% 100%',
  animation: `${shimmerAnimation} 1.5s ease-in-out infinite alternate`,
};
