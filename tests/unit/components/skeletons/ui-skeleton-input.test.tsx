import Box from '@mui/material/Box';
import { render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import styles from '@/components/skeletons/ui-skeleton-input/styles';

jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: jest.fn(({ children }: PropsWithChildren) => <div>{children}</div>),
}));

describe('UISkeletonInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<UISkeletonInput />);

    expect(Box).toHaveBeenCalledTimes(2);
  });

  it('renders exactly one inner placeholder child', () => {
    render(<UISkeletonInput />);
    const boxCalls = (Box as unknown as jest.Mock).mock.calls.map(([props]) => props);

    expect(boxCalls[0]).toEqual(expect.objectContaining({ id: undefined, sx: styles.inputContainer }));
    expect(boxCalls[1]).toEqual(
      expect.objectContaining({
        className: 'ui-skeleton-input__placeholder',
        sx: styles.inputPlaceholder,
      })
    );
  });
});
