import { render, screen } from '@testing-library/react';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import type { SkeletonTextSize } from '@/components/skeletons/ui-skeleton-text/types';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const SKELETON_ID = 'ui-skeleton-text';
const SHIMMER_GRADIENT =
  'linear-gradient(90deg, rgba(211, 216, 224, 0) 0%, ' +
  'rgba(211, 216, 224, 0.6) 49.13%, rgba(211, 216, 224, 0) 100%)';

function skeletonText(id = SKELETON_ID): HTMLElement {
  const element = screen.getAllByRole('generic', { hidden: true }).find((el) => el.id === id);
  if (!element) throw new Error(`Skeleton text element with id "${id}" not found`);
  return element;
}

describe('UISkeletonText', () => {
  it('renders one decorative bar hidden from assistive technology', () => {
    render(<UISkeletonText id={SKELETON_ID} />);

    expect(skeletonText()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('generic').map((el) => el.id)).not.toContain(SKELETON_ID);
  });

  it('renders a medium, full-width, pill-shaped shimmer bar by default', () => {
    render(<UISkeletonText id={SKELETON_ID} />);

    expect(skeletonText()).toHaveStyle({
      height: '12px',
      width: '100%',
      borderRadius: '57px',
      backgroundSize: '200% 100%',
    });
    expect(getComputedStyle(skeletonText()).backgroundImage.replace(/\s+/g, '')).toBe(
      SHIMMER_GRADIENT.replace(/\s+/g, '')
    );
    expect(styleRuleFor(skeletonText())?.getPropertyValue('animation')).toContain(
      '1.5s ease-in-out infinite alternate'
    );
  });

  it.each<[SkeletonTextSize, string]>([
    ['s', '8px'],
    ['m', '12px'],
    ['l', '18px'],
  ])('renders size "%s" at %s tall', (size, height) => {
    render(<UISkeletonText id={SKELETON_ID} size={size} width="45%" />);

    expect(skeletonText()).toHaveStyle({ height, width: '45%' });
  });

  it('stops the shimmer for users who prefer reduced motion', () => {
    render(<UISkeletonText id={SKELETON_ID} />);

    expect(
      mediaStyleRuleFor(skeletonText(), 'prefers-reduced-motion:reduce')?.getPropertyValue(
        'animation'
      )
    ).toBe('none');
  });

  it('keeps the bar outlined when forced colours drop its gradient', () => {
    render(<UISkeletonText id={SKELETON_ID} />);

    expect(
      mediaStyleRuleFor(skeletonText(), 'forced-colors:active')?.getPropertyValue('outline')
    ).toBe('1px solid GrayText');
  });

  it('forwards a single sx object on top of the base styles', () => {
    render(<UISkeletonText id={SKELETON_ID} sx={{ mt: 3 }} />);

    expect(skeletonText()).toHaveStyle({ marginTop: '24px', height: '12px' });
  });

  it('forwards every entry of an sx array on top of the base styles', () => {
    render(<UISkeletonText id={SKELETON_ID} sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect(skeletonText()).toHaveStyle({
      marginTop: '8px',
      marginBottom: '16px',
      borderRadius: '57px',
    });
  });

  it('has no interactive elements', () => {
    render(<UISkeletonText id={SKELETON_ID} />);

    expect(screen.queryAllByRole('button', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('link', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('textbox', { hidden: true })).toHaveLength(0);
  });
});
