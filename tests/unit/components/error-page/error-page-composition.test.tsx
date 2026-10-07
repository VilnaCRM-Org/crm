import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';

import ErrorPageComposition from '@/components/error-page/error-page-composition';
import type { ErrorPageVariantId } from '@/components/types/error-page';
import renderWithProviders from '@tests/unit/utils/render-with-providers';
import { assertInstanceOf } from '@tests/utils/assert-result';

jest.mock('@/assets/illustrations/error-page/curve.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/diamond.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-columns.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-rows.svg', () => ({ ReactComponent: 'svg' }));

const DIGITS_ID = 'error-page-digits';

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

const compositionParts = (container: HTMLElement, title: string): CompositionParts => {
  const heading = screen.getByRole('heading', { level: 1, name: title });
  const generics = within(container).getAllByRole('generic', { hidden: true });
  const digits = generics.find((element) => element.id === DIGITS_ID);
  assertInstanceOf(digits, HTMLElement);
  const composition = generics.find(
    (element) => element.contains(digits) && element.contains(heading)
  );
  assertInstanceOf(composition, HTMLElement);
  const illustration = within(composition)
    .getAllByRole('generic', { hidden: true })
    .find((element) => element.getAttribute('aria-hidden') === 'true' && element !== digits);
  assertInstanceOf(illustration, HTMLElement);
  return { composition, illustration, digits, heading };
};

const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;

describe('ErrorPageComposition', () => {
  it.each(VARIANTS)(
    'stacks the illustration, the digits and the card in order for %s',
    (variant, code, title) => {
      const { container } = renderWithProviders(<ErrorPageComposition variant={variant} />);
      const { composition, illustration, digits, heading } = compositionParts(container, title);

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
    const { container } = renderWithProviders(<ErrorPageComposition variant="notFound" />);
    const { composition } = compositionParts(container, 'Error 404');

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
