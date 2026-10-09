import { render, screen } from '@testing-library/react';

import UITextLink from '@/components/ui-text-link';

const label: string = 'Forgot password?';

const styleRulesOf = (element: HTMLElement): CSSStyleRule[] => {
  const classes = Array.from(element.classList, (name) => `.${name}`);

  return Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
    .filter((rule) => classes.some((name) => rule.selectorText.startsWith(name)));
};

const ruleFor = (element: HTMLElement, suffix: string): CSSStyleDeclaration | undefined =>
  styleRulesOf(element).find((rule) =>
    Array.from(element.classList).some((name) => rule.selectorText === `.${name}${suffix}`)
  )?.style;

describe('UITextLink', () => {
  it('renders a link named by its text to the given href', () => {
    render(<UITextLink href="/password-recovery">{label}</UITextLink>);

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', '/password-recovery');
  });

  it('draws the Figma brand text link with no underline', () => {
    render(<UITextLink href="/password-recovery">{label}</UITextLink>);

    const style = getComputedStyle(screen.getByRole('link', { name: label }));

    expect(style.color).toBe('rgb(30, 174, 255)');
    expect(style.fontWeight).toBe('500');
    expect(style.fontSize).toBe('0.9375rem');
    expect(style.lineHeight).toBe('1.125rem');
    expect(style.textDecoration).toBe('none');
  });

  it('draws the keyboard focus outline in the high-contrast dark ink', () => {
    render(<UITextLink href="/password-recovery">{label}</UITextLink>);

    const link = screen.getByRole('link', { name: label });
    const focusStyle = ruleFor(link, ':focus');
    const pointerFocusStyle = ruleFor(link, ':focus:not(:focus-visible)');

    expect(focusStyle?.getPropertyValue('outline')).toBe('2px solid #404142');
    expect(focusStyle?.getPropertyValue('outline-offset')).toBe('2px');
    expect(pointerFocusStyle?.getPropertyValue('outline')).toBe('none');
  });
});
