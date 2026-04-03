import { render, screen } from '@testing-library/react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import getBlockSkeletonStyles from '@/components/skeletons/ui-skeleton-block/styles';

jest.mock('@/components/skeletons/ui-skeleton-block/styles', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

describe('UISkeletonBlock', () => {
  const getSkeletonBlock = (): HTMLElement => {
    const element = screen.getAllByRole('generic').find((el) => el.id === 'skeleton-block');
    if (!element) throw new Error('skeleton-block not found');
    return element;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<UISkeletonBlock id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('100%', '3rem', '8px');
  });

  it('renders with custom dimensions and borderRadius', () => {
    render(
      <UISkeletonBlock
        width="200px"
        height="4rem"
        borderRadius="12px"
        id="skeleton-block"
      />
    );

    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('200px', '4rem', '12px');
  });

  it('applies array sx without dropping the base styles', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonBlock sx={arraySx} id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('100%', '3rem', '8px');
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonBlock sx={{ mt: 1 }} id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
  });

  it('renders cleanly when sx is undefined', () => {
    render(<UISkeletonBlock sx={undefined} id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
  });

  it('has no interactive elements', () => {
    render(<UISkeletonBlock id="skeleton-block" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('renders consistently across re-renders', () => {
    const { rerender } = render(<UISkeletonBlock id="skeleton-block" />);
    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');

    rerender(<UISkeletonBlock width="50%" id="skeleton-block" />);
    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
    expect(getBlockSkeletonStyles).toHaveBeenLastCalledWith('50%', '3rem', '8px');
  });
});
