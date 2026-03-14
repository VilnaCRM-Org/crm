import { render, screen } from '@testing-library/react';

import AuthSkeleton from '@/components/Skeletons/AuthSkeleton';

describe('AuthSkeleton Component', () => {
  describe('Rendering structure', () => {
    it('should render the component without crashing', () => {
      render(<AuthSkeleton />);
      const divider = screen.getByRole('presentation');
      expect(divider).toBeInTheDocument();
    });

    it('should render skeleton elements', () => {
      render(<AuthSkeleton />);
      expect(screen.getByTestId('auth-skeleton-title')).toBeInTheDocument();
      expect(screen.getByTestId('auth-skeleton-subtitle')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^auth-skeleton-field-label-/)).toHaveLength(3);
      expect(screen.getAllByTestId(/^auth-skeleton-input-/)).toHaveLength(3);
      expect(screen.getByTestId('auth-skeleton-submit')).toBeInTheDocument();
    });
  });

  describe('Divider skeleton', () => {
    it('should render a divider with presentation role', () => {
      render(<AuthSkeleton />);
      const divider = screen.getByRole('presentation');
      expect(divider).toBeInTheDocument();
    });

    it('should be hidden from assistive technology', () => {
      render(<AuthSkeleton />);
      expect(screen.getByRole('presentation')).toHaveAttribute('role', 'presentation');
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-label', 'Loading authentication form');
      const divider = screen.getByRole('presentation');
      expect(divider).toBeInTheDocument();
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
      const divider1 = screen.getByRole('presentation');
      expect(divider1).toBeInTheDocument();

      rerender(<AuthSkeleton />);
      const divider2 = screen.getByRole('presentation');
      expect(divider2).toBeInTheDocument();
    });

    it('should be static content without user interaction', () => {
      render(<AuthSkeleton />);
      const divider = screen.getByRole('presentation');
      expect(divider).toBeInTheDocument();
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

});
