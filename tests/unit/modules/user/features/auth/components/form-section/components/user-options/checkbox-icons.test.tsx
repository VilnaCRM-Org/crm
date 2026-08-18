import { render, screen } from '@testing-library/react';

import { customColors } from '@/styles/colors';
import {
  CheckBoxChecked,
  CheckBoxIcon,
} from '@auth/components/form-section/components/user-options/checkbox-icons';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const UNCHECKED_LABEL = 'remember me box';
const CHECKED_LABEL = 'remember me box, checked';

const renderIcons = (): void => {
  render(
    <>
      <CheckBoxIcon role="img" aria-label={UNCHECKED_LABEL} />
      <CheckBoxChecked role="img" aria-label={CHECKED_LABEL} />
    </>
  );
};

const iconElement = (label: string): HTMLElement => screen.getByRole('img', { name: label });

const declarationOf = (label: string, suffix = ''): CSSStyleDeclaration => {
  const declaration = styleRuleFor(iconElement(label), suffix);
  if (!declaration) {
    throw new Error(`no emotion rule was generated for "${label}${suffix}"`);
  }
  return declaration;
};

describe('CheckBoxIcon (unchecked remember-me box)', () => {
  it('pins the 1.25rem square footprint', () => {
    renderIcons();
    const declaration = declarationOf(UNCHECKED_LABEL);

    expect(declaration.getPropertyValue('width')).toBe('1.25rem');
    expect(declaration.getPropertyValue('height')).toBe('1.25rem');
  });

  it('draws a 1px checkbox-token outline with an 8px radius', () => {
    renderIcons();
    const declaration = declarationOf(UNCHECKED_LABEL);

    expect(declaration.getPropertyValue('border')).toBe(`1px solid ${customColors.checkbox.main}`);
    expect(declaration.getPropertyValue('border-radius')).toBe('8px');
    expect(declaration.getPropertyValue('color')).toBe(customColors.checkbox.main);
  });

  it('stays an empty outline: no fill and no check mark', () => {
    renderIcons();
    const declaration = declarationOf(UNCHECKED_LABEL);

    expect(declaration.getPropertyValue('background-color')).toBe('');
    expect(styleRuleFor(iconElement(UNCHECKED_LABEL), '::after')).toBeUndefined();
  });
});

describe('CheckBoxChecked (checked remember-me box)', () => {
  it('pins the same 1.25rem square footprint as the unchecked box', () => {
    renderIcons();
    const declaration = declarationOf(CHECKED_LABEL);

    expect(declaration.getPropertyValue('width')).toBe('1.25rem');
    expect(declaration.getPropertyValue('height')).toBe('1.25rem');
    expect(declaration.getPropertyValue('width')).toBe(
      declarationOf(UNCHECKED_LABEL).getPropertyValue('width')
    );
  });

  it('fills the box with the checkbox token and keeps the 8px radius outline', () => {
    renderIcons();
    const declaration = declarationOf(CHECKED_LABEL);

    expect(declaration.getPropertyValue('border')).toBe(`1px solid ${customColors.checkbox.main}`);
    expect(declaration.getPropertyValue('border-radius')).toBe('8px');
    expect(declaration.getPropertyValue('background-color')).toBe(customColors.checkbox.main);
  });

  it('centers the check mark with flexbox', () => {
    renderIcons();
    const declaration = declarationOf(CHECKED_LABEL);

    expect(declaration.getPropertyValue('display')).toBe('flex');
    expect(declaration.getPropertyValue('align-items')).toBe('center');
    expect(declaration.getPropertyValue('justify-content')).toBe('center');
  });

  it('renders a distinct class from the unchecked box', () => {
    renderIcons();

    expect(iconElement(CHECKED_LABEL).className).not.toBe(iconElement(UNCHECKED_LABEL).className);
  });
});

describe('CheckBoxChecked ::after check mark', () => {
  it('generates the pseudo element with an empty content token', () => {
    renderIcons();

    expect(declarationOf(CHECKED_LABEL, '::after').getPropertyValue('content')).toBe('""');
  });

  it('sizes the tick to 0.7rem by 0.5rem', () => {
    renderIcons();
    const declaration = declarationOf(CHECKED_LABEL, '::after');

    expect(declaration.getPropertyValue('width')).toBe('0.7rem');
    expect(declaration.getPropertyValue('height')).toBe('0.5rem');
  });

  it('draws the tick with white left and bottom strokes only', () => {
    renderIcons();
    const declaration = declarationOf(CHECKED_LABEL, '::after');

    expect(declaration.getPropertyValue('border-left')).toBe('3px solid white');
    expect(declaration.getPropertyValue('border-bottom')).toBe('3px solid white');
    expect(declaration.getPropertyValue('border-top')).toBe('');
    expect(declaration.getPropertyValue('border-right')).toBe('');
  });

  it('rotates the strokes counter-clockwise into a tick', () => {
    renderIcons();

    expect(declarationOf(CHECKED_LABEL, '::after').getPropertyValue('transform')).toBe(
      'rotate(-45deg)'
    );
  });
});
