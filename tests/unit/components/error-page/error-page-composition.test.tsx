import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import ErrorPageComposition from '@/components/error-page/error-page-composition';
import type { ErrorPageVariantId } from '@/components/types/error-page';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

jest.mock('@/assets/illustrations/error-page/curve.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/diamond.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-columns.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-rows.svg', () => ({ ReactComponent: 'svg' }));

const VARIANTS: [ErrorPageVariantId, string, string][] = [
  ['notFound', '404', 'Error 404'],
  ['forbidden', '403', 'Access denied'],
  ['serverError', '5xx', 'Server error'],
];

interface CompositionParts {
  composition: HTMLElement;
  illustration: HTMLElement;
  digits: HTMLElement;
  heading: HTMLElement;
}

const compositionParts = (title: string): CompositionParts => {
  const [, composition, illustration] = screen.getAllByRole('generic', { hidden: true });
  const digits = screen
    .getAllByRole('generic', { hidden: true })
    .find((element) => element.id === 'error-page-digits');
  expect(composition).toBeInstanceOf(HTMLElement);
  expect(illustration).toBeInstanceOf(HTMLElement);
  expect(digits).toBeInstanceOf(HTMLElement);
  return {
    composition: composition as HTMLElement,
    illustration: illustration as HTMLElement,
    digits: digits as HTMLElement,
    heading: screen.getByRole('heading', { level: 1, name: title }),
  };
};

const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;

describe('ErrorPageComposition', () => {
  it.each(VARIANTS)(
    'stacks the illustration, the digits and the card in order for %s',
    (variant, code, title) => {
      renderWithProviders(<ErrorPageComposition variant={variant} />);
      const { composition, illustration, digits, heading } = compositionParts(title);

      expect(illustration).toHaveAttribute('aria-hidden', 'true');
      expect(illustration).toHaveTextContent(/^$/);
      expect(digits).toHaveTextContent(new RegExp(`^${code}$`));
      expect(composition).toContainElement(illustration);
      expect(composition).toContainElement(digits);
      expect(composition).toContainElement(heading);
      expect(illustration.compareDocumentPosition(digits) & FOLLOWING).toBe(FOLLOWING);
      expect(digits.compareDocumentPosition(heading) & FOLLOWING).toBe(FOLLOWING);
      expect(illustration).not.toContainElement(digits);
      expect(digits).not.toContainElement(heading);
    }
  );

  it('positions the composition as the isolated origin of its decoration', () => {
    renderWithProviders(<ErrorPageComposition variant="notFound" />);
    const { composition } = compositionParts('Error 404');

    expect(composition).toHaveStyle({
      position: 'relative',
      isolation: 'isolate',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '614px',
    });
  });
});
