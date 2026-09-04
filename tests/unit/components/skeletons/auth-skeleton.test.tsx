import { render, screen } from '@testing-library/react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import { buildFeatureFlagConfig } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

afterEach(() => {
  clearConfigBlock();
});

function getGenericSkeletonIds(): string[] {
  return (screen.getAllByRole('generic') as HTMLElement[]).map((element) => element.id);
}

function getPresentationSkeletonIds(): string[] {
  return (screen.getAllByRole('presentation') as HTMLElement[]).map((element) => element.id);
}

describe('AuthSkeleton Component', () => {
  describe('Rendering structure (OAuth flag off, default)', () => {
    it('renders no divider and no social placeholders so the skeleton matches the page', () => {
      render(<AuthSkeleton />);
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'auth.loadingForm');

      const genericIds = getGenericSkeletonIds();
      expect(genericIds).toEqual(
        expect.arrayContaining(['auth-skeleton-title', 'auth-skeleton-submit'])
      );
      expect(genericIds.filter((id) => id.startsWith('auth-skeleton-social-'))).toHaveLength(0);
    });

    it('should render skeleton elements', () => {
      render(<AuthSkeleton />);
      const genericIds = getGenericSkeletonIds();

      expect(genericIds).toEqual(
        expect.arrayContaining([
          'auth-skeleton-title',
          'auth-skeleton-subtitle',
          'auth-skeleton-submit',
        ])
      );
      expect(genericIds.filter((id) => id.startsWith('auth-skeleton-field-label-'))).toHaveLength(
        3
      );
      expect(genericIds.filter((id) => id.startsWith('auth-skeleton-input-'))).toHaveLength(3);
    });
  });

  describe('Rendering structure (OAuth flag on)', () => {
    beforeEach(() => {
      writeConfigBlock(buildFeatureFlagConfig({ oauthProviders: true }));
    });

    it('renders the presentation divider and keeps it free of textual content', () => {
      render(<AuthSkeleton />);
      const divider = screen.getByRole('presentation');
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveTextContent('');
      expect(getPresentationSkeletonIds()).toContain('auth-skeleton-divider');
    });

    it('renders the full skeleton tree when animation is disabled', () => {
      render(<AuthSkeleton disableAnimation />);
      const genericIds = getGenericSkeletonIds();

      expect(genericIds).toEqual(
        expect.arrayContaining(['auth-skeleton-title', 'auth-skeleton-switcher'])
      );
      expect(genericIds.filter((id) => id.startsWith('auth-skeleton-input-'))).toHaveLength(3);
      expect(genericIds.filter((id) => id.startsWith('auth-skeleton-social-'))).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-label', 'auth.loadingForm');
    });

    it('should not have interactive elements during loading', () => {
      render(<AuthSkeleton />);
      const buttons = screen.queryAllByRole('button');
      const links = screen.queryAllByRole('link');
      const inputs = screen.queryAllByRole('textbox');
      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });

    it('should not have form elements during loading', () => {
      render(<AuthSkeleton />);
      const checkboxes = screen.queryAllByRole('checkbox');
      const radios = screen.queryAllByRole('radio');
      const selects = screen.queryAllByRole('combobox');
      expect(checkboxes).toHaveLength(0);
      expect(radios).toHaveLength(0);
      expect(selects).toHaveLength(0);
    });
  });

  describe('Component behavior', () => {
    it('should render consistently on multiple renders', () => {
      const { rerender } = render(<AuthSkeleton />);
      expect(screen.getByRole('region')).toBeInTheDocument();

      rerender(<AuthSkeleton />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });
});
