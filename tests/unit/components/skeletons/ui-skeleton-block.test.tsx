import { render, screen } from '@testing-library/react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import { mediaStyleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const SKELETON_ID = 'skeleton-block';

function skeletonBlock(): HTMLElement {
  const element = screen
    .getAllByRole('generic', { hidden: true })
    .find((el) => el.id === SKELETON_ID);
  if (!element) throw new Error(`Skeleton block element with id "${SKELETON_ID}" not found`);
  return element;
}

describe('UISkeletonBlock', () => {
  it('renders one decorative block hidden from assistive technology', () => {
    render(<UISkeletonBlock id={SKELETON_ID} />);

    expect(skeletonBlock()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('generic').map((el) => el.id)).not.toContain(SKELETON_ID);
  });

  it('renders a full-width 3rem shimmer block with an 8px radius by default', () => {
    render(<UISkeletonBlock id={SKELETON_ID} />);

    expect(skeletonBlock()).toHaveStyle({
      width: '100%',
      height: '3rem',
      borderRadius: '8px',
      backgroundSize: '200% 100%',
    });
  });

  it('renders the requested dimensions and radius', () => {
    render(<UISkeletonBlock id={SKELETON_ID} width="200px" height="4rem" borderRadius="12px" />);

    expect(skeletonBlock()).toHaveStyle({ width: '200px', height: '4rem', borderRadius: '12px' });
  });

  it('stops the shimmer for users who prefer reduced motion', () => {
    render(<UISkeletonBlock id={SKELETON_ID} />);

    expect(
      mediaStyleRuleFor(skeletonBlock(), 'prefers-reduced-motion:reduce')?.getPropertyValue(
        'animation'
      )
    ).toBe('none');
  });

  it('forwards a single sx object on top of the base styles', () => {
    render(<UISkeletonBlock id={SKELETON_ID} sx={{ mt: 1 }} />);

    expect(skeletonBlock()).toHaveStyle({ marginTop: '8px', height: '3rem' });
  });

  it('forwards every entry of an sx array on top of the base styles', () => {
    render(<UISkeletonBlock id={SKELETON_ID} sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect(skeletonBlock()).toHaveStyle({
      marginTop: '8px',
      marginBottom: '16px',
      borderRadius: '8px',
    });
  });

  it('re-renders with the latest dimensions', () => {
    const { rerender } = render(<UISkeletonBlock id={SKELETON_ID} />);

    rerender(<UISkeletonBlock id={SKELETON_ID} width="50%" />);

    expect(skeletonBlock()).toHaveStyle({ width: '50%', height: '3rem' });
  });

  it('has no interactive elements', () => {
    render(<UISkeletonBlock id={SKELETON_ID} />);

    expect(screen.queryAllByRole('button', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('link', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('textbox', { hidden: true })).toHaveLength(0);
  });
});
