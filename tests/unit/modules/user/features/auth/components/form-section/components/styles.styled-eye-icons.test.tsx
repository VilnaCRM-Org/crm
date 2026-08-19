import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import breakpointsTheme from '@/components/ui-breakpoints';
import { StyledEyeIcon, StyledEyeIconOff } from '@auth/components/form-section/components/styles';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

jest.mock('@auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

jest.mock('@auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

const SHOW_LABEL = 'show password';
const HIDE_LABEL = 'hide password';

const MD_MEDIA = `min-width:${breakpointsTheme.breakpoints.values.md}px`;

const renderIcons = (): void => {
  render(
    <ThemeProvider theme={breakpointsTheme}>
      <StyledEyeIcon role="img" aria-label={SHOW_LABEL} />
      <StyledEyeIconOff role="img" aria-label={HIDE_LABEL} />
    </ThemeProvider>
  );
};

const iconElement = (label: string): HTMLElement => screen.getByRole('img', { name: label });

const baseDeclarationOf = (label: string): CSSStyleDeclaration => {
  const declaration = styleRuleFor(iconElement(label));
  if (!declaration) {
    throw new Error(`no emotion rule was generated for "${label}"`);
  }
  return declaration;
};

const mdDeclarationOf = (label: string): CSSStyleDeclaration => {
  const declaration = mediaStyleRuleFor(iconElement(label), MD_MEDIA);
  if (!declaration) {
    throw new Error(`no "${MD_MEDIA}" override was generated for "${label}"`);
  }
  return declaration;
};

describe.each([
  ['StyledEyeIcon', SHOW_LABEL],
  ['StyledEyeIconOff', HIDE_LABEL],
])('%s', (_name, label) => {
  it('pins the compact 20x24px glyph box below the md breakpoint', () => {
    renderIcons();
    const declaration = baseDeclarationOf(label);

    expect(declaration.getPropertyValue('width')).toBe('20px');
    expect(declaration.getPropertyValue('height')).toBe('24px');
  });

  it('leaves the glyph unfilled so the svg strokes carry the shape', () => {
    renderIcons();

    expect(baseDeclarationOf(label).getPropertyValue('fill')).toBe('none');
  });

  it('widens the glyph to 24px from the md breakpoint up', () => {
    renderIcons();

    expect(mdDeclarationOf(label).getPropertyValue('width')).toBe('24px');
    expect(baseDeclarationOf(label).getPropertyValue('width')).not.toBe('24px');
  });

  it('overrides only the width at the md breakpoint', () => {
    renderIcons();
    const declaration = mdDeclarationOf(label);

    expect(declaration.getPropertyValue('height')).toBe('');
    expect(declaration.getPropertyValue('fill')).toBe('');
  });
});

describe('password visibility toggle glyphs', () => {
  it('keeps both glyphs on one geometry contract so toggling never shifts layout', () => {
    renderIcons();
    const shown = baseDeclarationOf(SHOW_LABEL);
    const hidden = baseDeclarationOf(HIDE_LABEL);

    expect(hidden.getPropertyValue('width')).toBe(shown.getPropertyValue('width'));
    expect(hidden.getPropertyValue('height')).toBe(shown.getPropertyValue('height'));
    expect(hidden.getPropertyValue('fill')).toBe(shown.getPropertyValue('fill'));
    expect(mdDeclarationOf(HIDE_LABEL).getPropertyValue('width')).toBe(
      mdDeclarationOf(SHOW_LABEL).getPropertyValue('width')
    );
  });
});
