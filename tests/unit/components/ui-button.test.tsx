import { render, screen } from '@testing-library/react';

import UIButton from '@/components/ui-button';

describe('UIButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering as link', () => {
    it('should render as anchor when string to prop is provided', () => {
      render(<UIButton to="/test-path">Test Link Button</UIButton>);

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/test-path');
      expect(button.tagName.toLowerCase()).toBe('a');
    });

    it('should resolve object to props into a single href', () => {
      render(
        <UIButton to={{ pathname: '/home', search: '?tab=profile', hash: '#security' }}>
          Profile Link
        </UIButton>
      );

      expect(screen.getByRole('link')).toHaveAttribute('href', '/home?tab=profile#security');
    });

    it('falls back to a regular button when object to props resolve to an empty target', () => {
      render(<UIButton to={{}}>Empty Object Link</UIButton>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('href');
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('should render with text content when used as link', () => {
      render(<UIButton to="/home">Go Home</UIButton>);

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('omits the button type attribute when rendered as a link', () => {
      render(
        <UIButton to="/test-path" type="submit">
          Submit Link
        </UIButton>
      );

      expect(screen.getByRole('link')).not.toHaveAttribute('type');
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
        <UIButton to="/test" disabled>
          Disabled Link
        </UIButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('Mui-disabled');
    });

    it('respects an explicit component override instead of forcing an anchor', () => {
      render(
        <UIButton to="/test" component="button" type="submit">
          Override Button
        </UIButton>
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('href');
      expect(button).toHaveAttribute('type', 'submit');
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
