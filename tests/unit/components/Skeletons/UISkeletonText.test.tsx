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

    render(
      <UISkeletonText
        size={size}
        width={width}
        data-testid="ui-skeleton-text-custom"
      />
    );

    expect(screen.getByTestId('ui-skeleton-text-custom')).toBeInTheDocument();
    expect(getTextSkeletonStyles).toHaveBeenCalledWith(size, width);
  });

  it('renders with array sx prop', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(
      <UISkeletonText
        sx={arraySx}
        data-testid="ui-skeleton-text-array-sx"
      />
    );

    expect(screen.getByTestId('ui-skeleton-text-array-sx')).toBeInTheDocument();
  });
});
