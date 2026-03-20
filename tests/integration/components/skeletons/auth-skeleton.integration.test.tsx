/* eslint-disable react/react-in-jsx-scope, testing-library/no-container, testing-library/no-node-access */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AuthSkeleton from '@/modules/user/features/auth/components/auth-skeleton';

function getElementById(id: string): HTMLElement {
  const element = document.getElementById(id);

  expect(element).not.toBeNull();

  return element as HTMLElement;
}

function assertAuthSkeletonElements(): void {
  expect(getElementById('auth-skeleton-title')).toBeInTheDocument();
  expect(getElementById('auth-skeleton-subtitle')).toBeInTheDocument();
  expect(getElementById('auth-skeleton-subtitle-line2')).toBeInTheDocument();
  expect(document.querySelectorAll('[id^="auth-skeleton-field-label-"]')).toHaveLength(3);
  expect(document.querySelectorAll('[id^="auth-skeleton-input-"]')).toHaveLength(3);
  expect(getElementById('auth-skeleton-submit')).toBeInTheDocument();
  expect(getElementById('auth-skeleton-divider')).toBeInTheDocument();
  expect(document.querySelectorAll('[id^="auth-skeleton-social-"]')).toHaveLength(4);
  expect(getElementById('auth-skeleton-switcher')).toBeInTheDocument();
}

describe('AuthSkeleton integration', () => {
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
  ] as const;

  viewportCases.forEach(({ label, width }) => {
    describe(`structure at ${label}`, () => {
      beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
      });

      it('renders the loading section', () => {
        render(<AuthSkeleton />);

        expect(screen.getByRole('region', { name: 'Loading authentication form' })).toBeInTheDocument();
      });

      it('renders the full skeleton structure', () => {
        render(<AuthSkeleton />);

        assertAuthSkeletonElements();
      });

      it('does not render test-only data attributes', () => {
        const { container } = render(<AuthSkeleton />);

        expect(container.querySelector('[data-testid]')).toBeNull();
      });
    });
  });

  describe('cross-viewport consistency', () => {
    it('renders the loading region across viewports', () => {
      const viewports = [375, 768, 1024, 1920];

      viewports.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { unmount } = render(<AuthSkeleton />);

        expect(screen.getByRole('region', { name: 'Loading authentication form' })).toBeInTheDocument();
        unmount();
      });
    });

    it('keeps the skeleton non-interactive across viewports', () => {
      const viewports = [375, 768, 1024, 1920];

      viewports.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { unmount } = render(<AuthSkeleton />);

        expect(screen.queryAllByRole('button')).toHaveLength(0);
        expect(screen.queryAllByRole('link')).toHaveLength(0);
        unmount();
      });
    });
  });
});
