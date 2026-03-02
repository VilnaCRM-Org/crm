import { render, screen } from '@testing-library/react';

import UISkeletonText from '@/components/Skeletons/UISkeletonText';
import getTextSkeletonStyles from '@/components/Skeletons/UISkeletonText/styles';
import type { SkeletonTextSize } from '@/components/Skeletons/UISkeletonText/types';

jest.mock('@/components/Skeletons/UISkeletonText/styles', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

describe('UISkeletonText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses default size and width when props are omitted', () => {
    render(<UISkeletonText data-testid="ui-skeleton-text" />);

    expect(screen.getByTestId('ui-skeleton-text')).toBeInTheDocument();
    expect(getTextSkeletonStyles).toHaveBeenCalledWith('m', '100%');
  });

  it('passes provided size and width to style builder', () => {
    const size: SkeletonTextSize = 'l';
    const width = '45%';

    render(<UISkeletonText size={size} width={width} data-testid="ui-skeleton-text-custom" />);

    expect(screen.getByTestId('ui-skeleton-text-custom')).toBeInTheDocument();
    expect(getTextSkeletonStyles).toHaveBeenCalledWith(size, width);
  });

  it('renders with array sx prop', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonText sx={arraySx} data-testid="ui-skeleton-text-array-sx" />);

    expect(screen.getByTestId('ui-skeleton-text-array-sx')).toBeInTheDocument();
  });

  it('calls style builder with size "s" and provided width', () => {
    render(<UISkeletonText size="s" width="30%" data-testid="ui-skeleton-text-s" />);

    expect(screen.getByTestId('ui-skeleton-text-s')).toBeInTheDocument();
    expect(getTextSkeletonStyles).toHaveBeenCalledWith('s', '30%');
  });

  it('calls style builder with size "l" and provided width', () => {
    render(<UISkeletonText size="l" width="80%" data-testid="ui-skeleton-text-l" />);

    expect(screen.getByTestId('ui-skeleton-text-l')).toBeInTheDocument();
    expect(getTextSkeletonStyles).toHaveBeenCalledWith('l', '80%');
  });

  it('has no interactive elements', () => {
    render(<UISkeletonText data-testid="ui-skeleton-text" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
