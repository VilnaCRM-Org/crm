import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import BackToMain from '@/modules/BackToMain';

import renderWithProviders, { testTheme } from '../utils/renderWithProviders';

jest.mock('@/assets/icons/arrows/back-arrow.svg', () => 'back-arrow-mock.svg');

i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        buttons: {
          back_to_main: 'Back to main',
        },
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

describe('BackToMain Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<BackToMain />);

      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should render back arrow icon', () => {
      renderWithProviders(<BackToMain />);

      const icon = screen.getByAltText('Back arrow icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', 'back-arrow-mock.svg');
    });

    it('should render translated back text', () => {
      renderWithProviders(<BackToMain />);

      expect(screen.getByText('Back to main')).toBeInTheDocument();
    });
  });

  describe('Routing', () => {
    it('should have correct navigation link to root path', () => {
      renderWithProviders(<BackToMain />);

      const button = screen.getByRole('link');
      expect(button).toHaveAttribute('href', '/');
    });

    it('should render as a link component when to prop is provided', () => {
      renderWithProviders(<BackToMain />);

      const linkButton = screen.getByRole('link');
      expect(linkButton).toBeInTheDocument();
    });
  });

  describe('Styling and Props', () => {
    it('should have disableRipple prop set', () => {
      renderWithProviders(<BackToMain />);

      const button = screen.getByRole('link');
      expect(button).toHaveClass('MuiButtonBase-root');
    });

    it('should contain UIContainer wrapper', () => {
      renderWithProviders(<BackToMain />);

      const containerElement = screen.getByLabelText(/container/i);
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for icon', () => {
      renderWithProviders(<BackToMain />);

      const icon = screen.getByAltText('Back arrow icon');
      expect(icon).toBeInTheDocument();
    });

    it('should be keyboard accessible as a button', () => {
      renderWithProviders(<BackToMain />);

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('a');
    });
  });

  describe('Internationalization', () => {
    it('should use translation key for button text', () => {
      renderWithProviders(<BackToMain />);

      expect(screen.getByText('Back to main')).toBeInTheDocument();
    });

    it('should handle different languages', async () => {
      const testI18n = i18n.createInstance();
      await testI18n.init({
        lng: 'es',
        fallbackLng: 'en',
        resources: {
          es: {
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

      render(
        <BrowserRouter>
          <ThemeProvider theme={testTheme}>
            <I18nextProvider i18n={testI18n}>
              <BackToMain />
            </I18nextProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Volver al principal')).toBeInTheDocument();
    });
  });
});
