import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import ErrorPageDigits from '@/components/error-page/components/error-page-digits';
import type { ErrorPageVariantId } from '@/components/types/error-page';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const digitsBox = (): HTMLElement => {
  const box = screen
    .getAllByRole('generic', { hidden: true })
    .find((element) => element.id === 'error-page-digits');
  expect(box).toBeInstanceOf(HTMLElement);
  return box as HTMLElement;
};

const glyphSpans = (box: HTMLElement): HTMLElement[] =>
  within(box).getAllByText((_content, element) => element?.tagName === 'SPAN');

describe('ErrorPageDigits', () => {
  it.each<[ErrorPageVariantId, string, string, string, string, string]>([
    ['notFound', '4', '0', '4', '#1EAEFF', '#0E87CC'],
    ['forbidden', '4', '0', '3', '#1B2327', '#999999'],
    ['serverError', '5', 'x', 'x', '#FFC01E', '#CC9300'],
  ])(
    'renders the %s glyphs %s %s %s in the variant fill and shadow colours',
    (variant, first, second, third, fill, shadow) => {
      render(<ErrorPageDigits variant={variant} />);

      const box = digitsBox();
      const spans = glyphSpans(box);

      expect(spans).toHaveLength(3);
      expect(spans[0]).toHaveTextContent(new RegExp(`^${first}$`));
      expect(spans[1]).toHaveTextContent(new RegExp(`^${second}$`));
      expect(spans[2]).toHaveTextContent(new RegExp(`^${third}$`));
      expect(box).toHaveTextContent(new RegExp(`^${first}${second}${third}$`));
      expect(box).toHaveStyle({ color: fill });
      expect(styleRuleFor(box)?.getPropertyValue('--error-page-digit-shadow')).toBe(shadow);
    }
  );

  it('keeps every glyph out of the accessibility tree', () => {
    render(<ErrorPageDigits variant="forbidden" />);

    const box = digitsBox();

    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('generic')).toHaveLength(1);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryAllByRole('generic', { name: /4/ })).toHaveLength(0);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
