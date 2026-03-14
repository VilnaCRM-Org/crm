import { render } from '@testing-library/react';

import AuthSkeleton from '@/components/Skeletons/AuthSkeleton';
import UISkeletonText from '@/components/Skeletons/UISkeletonText';
import breakpointsTheme from '@/components/UIBreakpoints';

jest.mock('@/components/Skeletons/UISkeletonText', () => ({
  __esModule: true,
  default: jest.fn((props: { 'data-testid'?: string }) => (
    <div data-testid={props['data-testid'] ?? 'skeleton-text'} />
  )),
}));

describe('AuthSkeleton typography parity', () => {
  it('matches top text skeleton sizes to auth form typography', () => {
    render(<AuthSkeleton />);

    const calls = (UISkeletonText as unknown as jest.Mock).mock.calls.map(([props]) => props);
    const titleSkeleton = calls.find((props) => props['data-testid'] === 'auth-skeleton-title');
    const subtitleSkeleton = calls.find(
      (props) => props['data-testid'] === 'auth-skeleton-subtitle'
    );

    expect(titleSkeleton).toBeDefined();
    expect(subtitleSkeleton).toBeDefined();

    expect(titleSkeleton).toEqual(
      expect.objectContaining({
        size: 'l',
        width: '7.5rem',
      })
    );
    const titleSx = titleSkeleton.sx;
    const titleSxExpected = {
      height: '1.375rem',
      marginBottom: '0.5rem',
      [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: expect.objectContaining({
        height: '1.875rem',
        width: '10.3125rem',
        marginBottom: '0.9375rem',
      }),
    };
    if (Array.isArray(titleSx)) {
      expect(titleSx).toEqual(expect.arrayContaining([expect.objectContaining(titleSxExpected)]));
    } else {
      expect(titleSx).toEqual(expect.objectContaining(titleSxExpected));
    }

    expect(subtitleSkeleton).toEqual(
      expect.objectContaining({
        size: 'm',
        width: '17.25rem',
      })
    );
    const subtitleSx = subtitleSkeleton.sx;
    const subtitleSxExpected = {
      height: '1.5625rem',
      [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: expect.objectContaining({
        height: '1.625rem',
        width: '18.5rem',
      }),
    };
    if (Array.isArray(subtitleSx)) {
      expect(subtitleSx).toEqual(
        expect.arrayContaining([expect.objectContaining(subtitleSxExpected)])
      );
    } else {
      expect(subtitleSx).toEqual(expect.objectContaining(subtitleSxExpected));
    }
  });
});
