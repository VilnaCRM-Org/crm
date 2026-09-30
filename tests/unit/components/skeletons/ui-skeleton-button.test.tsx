import { render, screen } from '@testing-library/react';

import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const SKELETON_ID = 'skeleton-button';

function skeletonButton(): HTMLElement {
  const element = screen
    .getAllByRole('generic', { hidden: true })
    .find((el) => el.id === SKELETON_ID);
  if (!element) throw new Error(`Skeleton button element with id "${SKELETON_ID}" not found`);
  return element;
}

describe('UISkeletonButton', () => {
  it('renders one decorative button shape hidden from assistive technology', () => {
    render(<UISkeletonButton id={SKELETON_ID} />);

    expect(skeletonButton()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('generic').map((el) => el.id)).not.toContain(SKELETON_ID);
  });

  it('renders a full-width outlined pill that shimmers', () => {
    render(<UISkeletonButton id={SKELETON_ID} />);

    expect(skeletonButton()).toHaveStyle({
      width: '100%',
      height: '3.125rem',
      borderRadius: '57px',
      border: '1px solid #E1E7EA',
      backgroundSize: '200% 100%',
    });
  });

  it.each([
    ['min-width:375px', 'min-width', '19.6875rem'],
    ['min-width:768px', 'height', '4.375rem'],
    ['min-width:768px', 'min-width', '33.75rem'],
    ['min-width:1024px', 'min-width', '26.375rem'],
    ['min-width:1440px', 'height', '3.875rem'],
  ])('at %s sets %s to %s', (mediaFragment, property, value) => {
    render(<UISkeletonButton id={SKELETON_ID} />);

    expect(mediaStyleRuleFor(skeletonButton(), mediaFragment)?.getPropertyValue(property)).toBe(
      value
    );
  });

  it('keeps its base height outside every breakpoint', () => {
    render(<UISkeletonButton id={SKELETON_ID} />);

    expect(styleRuleFor(skeletonButton())?.getPropertyValue('height')).toBe('3.125rem');
  });

  it('forwards a single sx object on top of the base styles', () => {
    render(<UISkeletonButton id={SKELETON_ID} sx={{ mt: 1 }} />);

    expect(skeletonButton()).toHaveStyle({ marginTop: '8px', height: '3.125rem' });
  });

  it('forwards every entry of an sx array on top of the base styles', () => {
    render(<UISkeletonButton id={SKELETON_ID} sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect(skeletonButton()).toHaveStyle({
      marginTop: '8px',
      marginBottom: '16px',
      borderRadius: '57px',
    });
  });

  it('has no interactive elements', () => {
    render(<UISkeletonButton id={SKELETON_ID} />);

    expect(screen.queryAllByRole('button', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('link', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('textbox', { hidden: true })).toHaveLength(0);
  });
});
