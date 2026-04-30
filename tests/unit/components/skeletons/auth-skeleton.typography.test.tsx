import { render } from '@testing-library/react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import breakpointsTheme from '@/components/UIBreakpoints';

jest.mock('@/components/skeletons/ui-skeleton-text', () => ({
  __esModule: true,
  default: jest.fn((props: { id?: string }) => <div id={props.id ?? 'skeleton-text'} />),
}));

describe('AuthSkeleton typography parity', () => {
  it('matches top text skeleton sizes to auth form typography', () => {
    render(<AuthSkeleton />);

    const calls = (UISkeletonText as unknown as jest.Mock).mock.calls.map(([props]) => props);
    const titleSkeleton = calls.find((props) => props.id === 'auth-skeleton-title');
    const subtitleSkeleton = calls.find((props) => props.id === 'auth-skeleton-subtitle');

    expect(titleSkeleton).toBeDefined();
    expect(subtitleSkeleton).toBeDefined();
    if (!titleSkeleton || !subtitleSkeleton) {
      throw new Error('Missing expected skeleton text calls');
    }

    expect(titleSkeleton).toEqual(
      expect.objectContaining({
        size: 'l',
      })
    );
    const titleSx = titleSkeleton.sx;
    const titleSxExpected = {
      width: '7.5rem',
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
      })
    );
    const subtitleSx = subtitleSkeleton.sx;
    const subtitleSxExpected = {
      width: '17.25rem',
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
