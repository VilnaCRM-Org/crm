import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';

const SKELETON_ID = 'skeleton-input';
const SHIMMER_BACKGROUND_SIZE = '200% 100%';
const STATIC_BACKGROUND_SIZE = '100% 100%';

function skeletonLayers(): HTMLElement[] {
  const layers = screen
    .getAllByRole('generic')
    .filter(
      (element) =>
        element.id === SKELETON_ID || element.className.includes('ui-skeleton-input__placeholder')
    );
  if (layers.length !== 2) {
    throw new Error(`Expected a container and a placeholder layer, found ${layers.length}`);
  }
  return layers;
}

describe('UISkeletonInput animation default', () => {
  it('shimmers both layers when no animation preference is passed', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    skeletonLayers().forEach((layer) => {
      expect(layer).toHaveStyle({ backgroundSize: SHIMMER_BACKGROUND_SIZE });
      expect(layer).not.toHaveStyle({ animation: 'none' });
    });
  });

  it('shimmers both layers when animation is explicitly enabled', () => {
    render(<UISkeletonInput disableAnimation={false} id={SKELETON_ID} />);

    skeletonLayers().forEach((layer) => {
      expect(layer).toHaveStyle({ backgroundSize: SHIMMER_BACKGROUND_SIZE });
    });
  });

  it('freezes both layers when animation is disabled', () => {
    render(<UISkeletonInput disableAnimation id={SKELETON_ID} />);

    skeletonLayers().forEach((layer) => {
      expect(layer).toHaveStyle({
        animation: 'none',
        backgroundSize: STATIC_BACKGROUND_SIZE,
      });
    });
  });
});
