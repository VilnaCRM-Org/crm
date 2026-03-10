import { render, screen } from '@testing-library/react';

import UIButton from '@/components/ui-button';

describe('UIButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering as RouterLink', () => {
    it('should render as link when to prop is provided without requiring router context', () => {
      render(<UIButton to="/test-path">Test Link Button</UIButton>);

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/test-path');
      expect(button).not.toHaveAttribute('type');
      expect(button.tagName.toLowerCase()).toBe('a');
    });

    it('should render with text content when used as link', () => {
      render(<UIButton to="/home">Go Home</UIButton>);

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  describe('Rendering as regular button', () => {
    it('should render as button when to prop is not provided', () => {
      render(<UIButton>Test Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button).not.toHaveAttribute('href');
    });

    it('should render as button when to prop is empty string', () => {
      render(<UIButton to="">Empty To Prop</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button).not.toHaveAttribute('to');
    });

    it('should render with text content when used as button', () => {
      render(<UIButton>Click Me</UIButton>);

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });
  });

  describe('Props passing', () => {
    it('should use the component prop when explicitly provided', () => {
      render(<UIButton component="button">Custom Component</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should pass through other Button props', () => {
      render(<UIButton disabled>Disabled Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through other Button props when used as link', () => {
      render(
        <UIButton to="/test" disabled>
          Disabled Link
        </UIButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('Mui-disabled');
    });
  });

  describe('Theme integration', () => {
    it('should render with ThemeProvider wrapper', () => {
      render(<UIButton>Themed Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-root');
    });
  });

  describe('Object to prop', () => {
    it('renders as link when to has only pathname', () => {
      render(<UIButton to={{ pathname: '/about' }}>About</UIButton>);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/about');
    });

    it('concatenates pathname, search, and hash', () => {
      render(
        <UIButton to={{ pathname: '/search', search: '?q=hello', hash: '#results' }}>
          Search
        </UIButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/search?q=hello#results');
    });

    it('renders as button when object to resolves to empty string', () => {
      render(<UIButton to={{}}>Empty Object</UIButton>);

      const button = screen.getByRole('button');
      expect(button.tagName.toLowerCase()).toBe('button');
    });
  });
});
