import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UISkeletonButton from '@/components/Skeletons/UISkeletonButton';

describe('UISkeletonButton Integration', () => {
  it('renders with default props', () => {
    render(<UISkeletonButton data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonButton sx={{ mt: 1 }} data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonButton sx={[{ mt: 1 }, { mb: 2 }]} data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });
});
