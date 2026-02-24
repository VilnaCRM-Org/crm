import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UISkeletonText from '@/components/Skeletons/UISkeletonText';

describe('UISkeletonText Integration', () => {
  it('renders with default size and width', () => {
    render(<UISkeletonText data-testid="skeleton-text" />);

    expect(screen.getByTestId('skeleton-text')).toBeInTheDocument();
  });

  it('renders with explicit size and width', () => {
    render(<UISkeletonText size="l" width="70%" data-testid="skeleton-text" />);

    expect(screen.getByTestId('skeleton-text')).toBeInTheDocument();
  });

  it('composes object sx prop', () => {
    render(<UISkeletonText sx={{ mt: 1 }} data-testid="skeleton-text" />);

    expect(screen.getByTestId('skeleton-text')).toBeInTheDocument();
  });

  it('composes array sx prop', () => {
    render(<UISkeletonText sx={[{ mt: 1 }, { mb: 2 }]} data-testid="skeleton-text" />);

    expect(screen.getByTestId('skeleton-text')).toBeInTheDocument();
  });
});
