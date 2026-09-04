import { screen } from '@testing-library/react';

import UIFooterContent from '@/components/ui-footer/ui-footer-content/ui-footer';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

jest.mock('@/assets/icons/logo/vilna-logo.svg', () => ({ ReactComponent: 'svg' }));

/**
 * The footer legal links are a localized contract: each anchor must carry BOTH the localized
 * accessible label and the localized visible text. The English strings below are the golden
 * values from src/i18n/localization.json, so a dropped or emptied translation call fails here.
 */
describe('UIFooterContent', () => {
  it('renders the privacy link with its localized label, text and href', () => {
    renderWithProviders(<UIFooterContent />);

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });

    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    expect(privacyLink).toHaveAttribute('aria-label', 'Privacy Policy');
    expect(privacyLink).toHaveTextContent('Privacy Policy');
  });

  it('renders the terms link with its localized label, text and href', () => {
    renderWithProviders(<UIFooterContent />);

    const termsLink = screen.getByRole('link', { name: 'Terms of Use' });

    expect(termsLink).toHaveAttribute('href', '/terms-of-use');
    expect(termsLink).toHaveAttribute('aria-label', 'Terms of Use');
    expect(termsLink).toHaveTextContent('Terms of Use');
  });

  it('exposes exactly the two localized legal links', () => {
    renderWithProviders(<UIFooterContent />);

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Privacy Policy',
      'Terms of Use',
    ]);
  });
});
