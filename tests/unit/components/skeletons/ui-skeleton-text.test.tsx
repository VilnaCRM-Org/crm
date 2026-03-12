import Box from '@mui/material/Box';
import { render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import getTextSkeletonStyles from '@/components/skeletons/ui-skeleton-text/styles';
import type { SkeletonTextSize } from '@/components/skeletons/ui-skeleton-text/types';

jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: jest.fn(({ children }: PropsWithChildren) => <div>{children}</div>),
}));

jest.mock('@/components/skeletons/ui-skeleton-text/styles', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

describe('UISkeletonText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses default size and width when props are omitted', () => {
    render(<UISkeletonText />);

    expect(getTextSkeletonStyles).toHaveBeenCalledWith('m', '100%');
    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([{}]);
  });

  it('passes provided size and width to the style builder', () => {
    const size: SkeletonTextSize = 'l';
    const width = '45%';

    render(<UISkeletonText size={size} width={width} />);

    expect(getTextSkeletonStyles).toHaveBeenCalledWith(size, width);
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonText sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([{}, { mt: 1 }, { mb: 2 }]);
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonText sx={{ mt: 1 }} />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([{}, { mt: 1 }]);
  });

  it('calls the style builder with size s and the provided width', () => {
    render(<UISkeletonText size="s" width="30%" />);

    expect(getTextSkeletonStyles).toHaveBeenCalledWith('s', '30%');
  });
});
