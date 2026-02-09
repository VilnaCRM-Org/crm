import { keyframes } from '@emotion/react';

export const shimmerAnimation = keyframes`
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
`;

export const shimmerGradient = `linear-gradient(
  90deg,
  rgba(211, 216, 224, 0) 0%,
  rgba(211, 216, 224, 0.6) 49.13%,
  rgba(211, 216, 224, 0) 100%
)`;

export const baseSkeletonStyle = {
  background: shimmerGradient,
  backgroundSize: '200% 100%',
  animation: `${shimmerAnimation} 1.5s ease-in-out infinite alternate`,
};
