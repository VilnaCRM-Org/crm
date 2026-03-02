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

  it('renders with object sx prop', () => {
    render(<UISkeletonBlock sx={{ mt: 1 }} data-testid="skeleton-block" />);

    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
  });

  it('has no interactive elements', () => {
    render(<UISkeletonBlock data-testid="skeleton-block" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('renders consistently across re-renders', () => {
    const { rerender } = render(<UISkeletonBlock data-testid="skeleton-block" />);
    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();

    rerender(<UISkeletonBlock width="50%" data-testid="skeleton-block" />);
    expect(screen.getByTestId('skeleton-block')).toBeInTheDocument();
    expect(getBlockSkeletonStyles).toHaveBeenLastCalledWith('50%', '3rem', '8px');
  });
});
