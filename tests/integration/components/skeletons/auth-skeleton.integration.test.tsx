import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';

function getGenericSkeletonElements(): HTMLElement[] {
  return screen.getAllByRole('generic') as HTMLElement[];
}

function getPresentationSkeletonElements(): HTMLElement[] {
  return screen.getAllByRole('presentation') as HTMLElement[];
}

function assertAuthSkeletonElements(): void {
  const genericIds = getGenericSkeletonElements().map((element) => element.id);
  const presentationIds = getPresentationSkeletonElements().map((element) => element.id);

  expect(genericIds).toEqual(
    expect.arrayContaining([
      'auth-skeleton-title',
      'auth-skeleton-subtitle',
      'auth-skeleton-subtitle-line2',
      'auth-skeleton-submit',
      'auth-skeleton-switcher',
    ])
  );
  expect(genericIds.filter((id) => id.startsWith('auth-skeleton-field-label-'))).toHaveLength(3);
  expect(genericIds.filter((id) => id.startsWith('auth-skeleton-input-'))).toHaveLength(3);
  expect(genericIds.filter((id) => id.startsWith('auth-skeleton-social-'))).toHaveLength(4);
  expect(presentationIds).toContain('auth-skeleton-divider');
}

describe('AuthSkeleton Integration Tests', () => {
  const originalInnerWidth = window.innerWidth;
  const viewportCases = [
    { label: 'mobile', width: 375 },
    { label: 'tablet', width: 768 },
    { label: 'desktop', width: 1024 },
    { label: 'large desktop', width: 1920 },
  ];

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('renders all skeleton elements', () => {
    expect(React).toBeDefined();
    render(<AuthSkeleton />);
    assertAuthSkeletonElements();
  });

  viewportCases.forEach(({ label, width }) => {
    describe(`Structural tests (${width}px)`, () => {
      beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
      });

      it(`should render skeleton structure on ${label} viewport`, () => {
        render(<AuthSkeleton />);
        const section = screen.getByRole('region');
        expect(section).toBeInTheDocument();
      });
    });
  });

  describe('Cross-viewport consistency', () => {
    it('should render section across all viewports', () => {
      const viewports = [375, 768, 1024, 1920];

      viewports.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { unmount } = render(<AuthSkeleton />);
        const section = screen.getByRole('region');
        expect(section).toBeInTheDocument();
        unmount();
      });
    });

    it('should maintain accessibility across viewports', () => {
      const viewports = [375, 768, 1024, 1920];

      viewports.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { unmount } = render(<AuthSkeleton />);
        const buttons = screen.queryAllByRole('button');
        const links = screen.queryAllByRole('link');
        expect(buttons).toHaveLength(0);
        expect(links).toHaveLength(0);
        unmount();
      });
    });
  });
});
