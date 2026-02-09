import { render, screen } from '@testing-library/react';

import UISkeletonButton from '@/components/Skeletons/UISkeletonButton';

describe('UISkeletonButton', () => {
  it('renders with default props', () => {
    render(<UISkeletonButton data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });

  it('composes array sx prop without spreading', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonButton sx={arraySx} data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });
});
