import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UISkeletonBlock from '@/components/Skeletons/UISkeletonBlock';

describe('UISkeletonBlock Integration', () => {
  it('renders with default props', () => {
    render(<UISkeletonBlock data-testid="skeleton-block" />);

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(
      <UISkeletonBlock
        width="200px"
        height="4rem"
        borderRadius="12px"
        data-testid="skeleton-block"
      />
    );

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });

  it('composes object sx prop', () => {
    render(
      <UISkeletonBlock sx={{ mt: 1 }} data-testid="skeleton-block" />
    );

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });

  it('composes array sx prop', () => {
    render(
      <UISkeletonBlock sx={[{ mt: 1 }, { mb: 2 }]} data-testid="skeleton-block" />
    );

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });
});
