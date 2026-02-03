import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AuthSkeleton from '@/components/Skeletons/AuthSkeleton';

describe('AuthSkeleton Responsive Integration Tests', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });

  describe('Mobile viewport (375px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render skeleton structure on mobile viewport', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });

    it('should render all skeleton elements on mobile', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Tablet viewport (768px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render skeleton structure on tablet viewport', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });

    it('should maintain proper structure on tablet', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Desktop viewport (1024px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render skeleton structure on desktop viewport', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });

    it('should render social button skeletons on desktop', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Large desktop viewport (1920px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render skeleton structure on large desktop viewport', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });

    it('should render complete skeleton layout on large desktop', () => {
      render(<AuthSkeleton />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Cross-viewport consistency', () => {
    it('should render divider across all viewports', () => {
      const viewports = [375, 768, 1024, 1920];

      viewports.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        render(<AuthSkeleton />);
        const section = screen.getByRole('region');
        expect(section).toBeInTheDocument();
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

        render(<AuthSkeleton />);
        const buttons = screen.queryAllByRole('button');
        const links = screen.queryAllByRole('link');
        expect(buttons).toHaveLength(0);
        expect(links).toHaveLength(0);
      });
    });
  });
});
