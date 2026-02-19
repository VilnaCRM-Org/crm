import { render, screen } from '@testing-library/react';

import UISkeletonBlock from '@/components/Skeletons/UISkeletonBlock';

describe('UISkeletonBlock', () => {
  it('renders with default props', () => {
    render(<UISkeletonBlock data-testid="skeleton-block" />);

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });

  it('renders with custom dimensions and borderRadius', () => {
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

  it('composes array sx prop without spreading', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonBlock sx={arraySx} data-testid="skeleton-block" />);

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });
});
