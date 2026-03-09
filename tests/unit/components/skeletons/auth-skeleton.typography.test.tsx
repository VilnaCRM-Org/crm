import { render } from '@testing-library/react';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import breakpointsTheme from '@/components/ui-breakpoints';
import AuthSkeleton from '@/modules/user/features/auth/components/auth-skeleton';

jest.mock('@/components/skeletons/ui-skeleton-text', () => ({
  __esModule: true,
  default: jest.fn((props: { id?: string }) => <div id={props.id} />),
}));

describe('AuthSkeleton typography parity', () => {
  it('matches top text skeleton sizes to auth form typography', () => {
    render(<AuthSkeleton />);

    const calls = (UISkeletonText as unknown as jest.Mock).mock.calls.map(([props]) => props);
    const titleSkeleton = calls.find((props) => props.id === 'auth-skeleton-title');
    const subtitleSkeleton = calls.find((props) => props.id === 'auth-skeleton-subtitle');

    expect(titleSkeleton).toBeDefined();
    expect(subtitleSkeleton).toBeDefined();

    const definedTitleSkeleton = titleSkeleton!;
    const definedSubtitleSkeleton = subtitleSkeleton!;

    expect(definedTitleSkeleton).toEqual(
      expect.objectContaining({
        size: 'l',
      })
    );
    expect(definedTitleSkeleton.width).toBeUndefined();

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

    if (Array.isArray(definedTitleSkeleton.sx)) {
      expect(definedTitleSkeleton.sx).toEqual(
        expect.arrayContaining([expect.objectContaining(titleSxExpected)])
      );
    } else {
      expect(definedTitleSkeleton.sx).toEqual(expect.objectContaining(titleSxExpected));
    }

    expect(definedSubtitleSkeleton).toEqual(
      expect.objectContaining({
        size: 'm',
      })
    );
    expect(definedSubtitleSkeleton.width).toBeUndefined();

    const subtitleSxExpected = {
      width: '17.25rem',
      height: '1.5625rem',
      [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: expect.objectContaining({
        height: '1.625rem',
        width: '18.5rem',
      }),
    };

    if (Array.isArray(definedSubtitleSkeleton.sx)) {
      expect(definedSubtitleSkeleton.sx).toEqual(
        expect.arrayContaining([expect.objectContaining(subtitleSxExpected)])
      );
    } else {
      expect(definedSubtitleSkeleton.sx).toEqual(expect.objectContaining(subtitleSxExpected));
    }
  });
});
