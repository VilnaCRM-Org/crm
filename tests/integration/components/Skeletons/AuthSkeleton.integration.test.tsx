import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AuthSkeleton from '@/components/Skeletons/AuthSkeleton';

function assertAuthSkeletonElements(): void {
  expect(screen.getByTestId('auth-skeleton-title')).toBeInTheDocument();
  expect(screen.getByTestId('auth-skeleton-subtitle')).toBeInTheDocument();
  expect(screen.getByTestId('auth-skeleton-subtitle-line2')).toBeInTheDocument();
  expect(screen.getAllByTestId(/^auth-skeleton-field-label-/)).toHaveLength(3);
  expect(screen.getAllByTestId(/^auth-skeleton-input-/)).toHaveLength(3);
  expect(screen.getByTestId('auth-skeleton-submit')).toBeInTheDocument();
  expect(screen.getByTestId('auth-skeleton-divider')).toBeInTheDocument();
  expect(screen.getAllByTestId(/^auth-skeleton-social-/)).toHaveLength(4);
  expect(screen.getByTestId('auth-skeleton-switcher')).toBeInTheDocument();
}

describe('AuthSkeleton Integration Tests', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });

  const viewportCases = [
    { label: 'mobile', width: 375 },
    { label: 'tablet', width: 768 },
    { label: 'desktop', width: 1024 },
    { label: 'large desktop', width: 1920 },
  ];

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

      it(`should render all skeleton elements on ${label}`, () => {
        render(<AuthSkeleton />);
        assertAuthSkeletonElements();
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
