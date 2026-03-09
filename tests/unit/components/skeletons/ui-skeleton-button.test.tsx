import Box from '@mui/material/Box';
import { render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import styles from '@/components/skeletons/ui-skeleton-button/styles';

jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: jest.fn(({ children }: PropsWithChildren) => <div>{children}</div>),
}));

describe('UISkeletonButton', () => {
  beforeEach(() => {
    (Box as unknown as jest.Mock).mockClear();
  });

  it('renders with default props', () => {
    render(<UISkeletonButton />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([styles.buttonSkeleton, undefined]);
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonButton sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([
      styles.buttonSkeleton,
      { mt: 1 },
      { mb: 2 },
    ]);
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonButton sx={{ mt: 1 }} />);

    expect((Box as unknown as jest.Mock).mock.calls[0][0].sx).toEqual([
      styles.buttonSkeleton,
      { mt: 1 },
    ]);
  });
});
