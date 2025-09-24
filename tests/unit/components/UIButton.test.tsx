import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import UIButton from '@/components/UIButton';

describe('UIButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering as RouterLink', () => {
    it('should render as RouterLink when to prop is provided', () => {
      render(
        <BrowserRouter>
          <UIButton to="/test-path">Test Link Button</UIButton>
        </BrowserRouter>
      );

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/test-path');
      expect(button.tagName.toLowerCase()).toBe('a');
    });

    it('should render with text content when used as link', () => {
      render(
        <BrowserRouter>
          <UIButton to="/home">Go Home</UIButton>
        </BrowserRouter>
      );

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
    it('should pass through other Button props', () => {
      render(<UIButton disabled>Disabled Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through other Button props when used as link', () => {
      render(
        <BrowserRouter>
          <UIButton to="/test" disabled>
            Disabled Link
          </UIButton>
        </BrowserRouter>
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
});
