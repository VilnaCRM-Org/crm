import { render, screen } from '@testing-library/react';

import UISkeletonButton from '@/components/Skeletons/UISkeletonButton';

describe('UISkeletonButton', () => {
  it('renders with default props', () => {
    render(<UISkeletonButton data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });

  it('renders without error when sx is an array', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonButton sx={arraySx} data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonButton sx={{ mt: 1 }} data-testid="skeleton-button" />);

    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });

  it('has no interactive elements', () => {
    render(<UISkeletonButton data-testid="skeleton-button" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('renders consistently across re-renders', () => {
    const { rerender } = render(<UISkeletonButton data-testid="skeleton-button" />);
    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();

    rerender(<UISkeletonButton data-testid="skeleton-button" />);
    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument();
  });
});
