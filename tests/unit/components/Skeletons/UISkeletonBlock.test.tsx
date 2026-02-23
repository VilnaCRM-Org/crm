import { render, screen } from '@testing-library/react';

import UISkeletonBlock from '@/components/Skeletons/UISkeletonBlock';
import getBlockSkeletonStyles from '@/components/Skeletons/UISkeletonBlock/styles';

jest.mock('@/components/Skeletons/UISkeletonBlock/styles', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

describe('UISkeletonBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<UISkeletonBlock data-testid="skeleton-block" />);

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('100%', '3rem', '8px');
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
    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('200px', '4rem', '12px');
  });

  it('renders with array sx prop', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonBlock sx={arraySx} data-testid="skeleton-block" />);

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });
});
