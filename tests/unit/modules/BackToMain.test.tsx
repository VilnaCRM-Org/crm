import { screen } from '@testing-library/react';
import i18n from 'i18next';
import { within } from 'storybook/test';

import UIBackToMain from '@/components/UIBackToMain';

import renderWithProviders, { testTheme } from '../utils/renderWithProviders';

const BackToHomeText: string = 'Back to homepage';

jest.mock('@/assets/icons/arrows/back-arrow.svg', () => 'back-arrow-mock.svg');

describe('UIBackToMain Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<UIBackToMain />);

      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should render back arrow icon', () => {
      renderWithProviders(<UIBackToMain />);

      const icon = screen.getByRole('img', { hidden: true });

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', 'back-arrow-mock.svg');
    });

    it('should render translated back text', () => {
      renderWithProviders(<UIBackToMain />);

      expect(screen.getByText(BackToHomeText)).toBeInTheDocument();
    });
  });

  describe('Routing', () => {
    it('should have correct navigation link to root path', () => {
      renderWithProviders(<UIBackToMain />);

      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('href', '/');
    });

    it('should render as a link component when to prop is provided', () => {
      renderWithProviders(<UIBackToMain />);

      const linkButton = screen.getByRole('link');
      expect(linkButton).toBeInTheDocument();
    });
  });

  describe('Styling and Props', () => {
    it('should disable ripple effect', () => {
      renderWithProviders(<UIBackToMain />);

      const button = screen.getByText(BackToHomeText);
      expect(within(button).queryByTestId('ripple')).not.toBeInTheDocument();
    });
    it('should contain UIContainer wrapper', () => {
      renderWithProviders(<UIBackToMain />);

      const containerElement = screen.getByLabelText(/container/i);
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for icon', () => {
      renderWithProviders(<UIBackToMain />);

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });

    it('should be keyboard accessible as a link', () => {
      renderWithProviders(<UIBackToMain />);

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('a');
    });
  });

  describe('Internationalization', () => {
    it('should use translation key for button text', () => {
      renderWithProviders(<UIBackToMain />);

      expect(screen.getByText(BackToHomeText)).toBeInTheDocument();
    });

    it('should handle different languages', async () => {
      const i18nMock = i18n.createInstance();
      await i18nMock.init({
        lng: 'es',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              buttons: {
                back_to_main: 'Volver al principal',
              },
            },
          },
        },
        interpolation: {
          escapeValue: false,
        },
      });
      renderWithProviders(<UIBackToMain />, { i18nMock });

      expect(screen.getByText('Volver al principal')).toBeInTheDocument();
    });
  });

  describe('Theme Coverage', () => {
    it('should handle theme without primary.main color', async () => {
      const themeWithoutPrimary = {
        ...testTheme,
        palette: {
          ...testTheme.palette,
          primary: {
            ...testTheme.palette.primary,
            main: '',
          },
        },
      };
      renderWithProviders(<UIBackToMain />, { theme: themeWithoutPrimary });

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
    });
  });
});
