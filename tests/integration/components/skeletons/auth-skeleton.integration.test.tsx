import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import localization from '@/i18n/localization.json';
import testI18n from '@tests/i18n/test-i18n';

const AUTH_SKELETON_REGION_NAME = localization.en.translation.auth.loadingForm;

const renderAuthSkeleton = (disableAnimation = false): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={testI18n}>
      <AuthSkeleton disableAnimation={disableAnimation} />
    </I18nextProvider>
  );

function getGenericSkeletonElements(): HTMLElement[] {
  return screen.getAllByRole('generic', { hidden: true }) as HTMLElement[];
}

function getPresentationSkeletonElements(): HTMLElement[] {
  return screen.getAllByRole('presentation') as HTMLElement[];
}

function assertAuthSkeletonElements(): void {
  const genericIds = getGenericSkeletonElements()
    .map((element) => element.id)
    .filter(Boolean);
  const presentationIds = getPresentationSkeletonElements()
    .map((element) => element.id)
    .filter(Boolean);

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
    renderAuthSkeleton();
    assertAuthSkeletonElements();
  });

  it('renders the full skeleton tree when animation is disabled', () => {
    renderAuthSkeleton(true);

    assertAuthSkeletonElements();
    expect(screen.getByRole('region', { name: AUTH_SKELETON_REGION_NAME })).toBeInTheDocument();
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
        renderAuthSkeleton();
        const section = screen.getByRole('region', { name: AUTH_SKELETON_REGION_NAME });
        expect(section).toBeInTheDocument();
      });
    });
  });

  describe('Cross-viewport consistency', () => {
    it('should render section across all viewports', () => {
      viewportCases
        .map((c) => c.width)
        .forEach((width) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });
          window.dispatchEvent(new Event('resize'));

          const { unmount } = renderAuthSkeleton();
          const section = screen.getByRole('region', { name: AUTH_SKELETON_REGION_NAME });
          expect(section).toBeInTheDocument();
          unmount();
        });
    });

    it('should maintain accessibility across viewports', () => {
      viewportCases
        .map((c) => c.width)
        .forEach((width) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });
          window.dispatchEvent(new Event('resize'));

          const { unmount } = renderAuthSkeleton();
          const buttons = screen.queryAllByRole('button');
          const links = screen.queryAllByRole('link');
          expect(buttons).toHaveLength(0);
          expect(links).toHaveLength(0);
          unmount();
        });
    });
  });
});
