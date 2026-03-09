import Box from '@mui/material/Box';
import { render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import getBlockSkeletonStyles from '@/components/skeletons/ui-skeleton-block/styles';

jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: jest.fn(({ children }: PropsWithChildren) => <div>{children}</div>),
}));

jest.mock('@/components/skeletons/ui-skeleton-block/styles', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

describe('UISkeletonBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<UISkeletonBlock />);

    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('100%', '3rem', '8px');
    expect((Box as unknown as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: undefined, sx: {} })
    );
  });

  it('renders with custom dimensions and border radius', () => {
    render(<UISkeletonBlock width="200px" height="4rem" borderRadius="12px" />);

    expect(getBlockSkeletonStyles).toHaveBeenCalledWith('200px', '4rem', '12px');
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonBlock sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([{}, { mt: 1 }, { mb: 2 }]);
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonBlock sx={{ mt: 1 }} />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([{}, { mt: 1 }]);
  });
});
