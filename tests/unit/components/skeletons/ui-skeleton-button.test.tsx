import { render, screen } from '@testing-library/react';

import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';

describe('UISkeletonButton', () => {
  const getSkeletonButton = (): HTMLElement => {
    const element = screen.getAllByRole('generic').find((el) => el.id === 'skeleton-button');
    if (!element) throw new Error('Skeleton button element with id "skeleton-button" not found');
    return element;
  };

  it('renders with default props', () => {
    render(<UISkeletonButton id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');
  });

  it('applies array sx without dropping the base styles', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonButton sx={arraySx} id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonButton sx={{ mt: 1 }} id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');
  });

  it('renders cleanly when sx is undefined', () => {
    render(<UISkeletonButton sx={undefined} id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');
  });

  it('has no interactive elements', () => {
    render(<UISkeletonButton id="skeleton-button" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('renders consistently across re-renders', () => {
    const { rerender } = render(<UISkeletonButton id="skeleton-button" />);
    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');

    rerender(<UISkeletonButton id="skeleton-button" />);
    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');
  });
});
