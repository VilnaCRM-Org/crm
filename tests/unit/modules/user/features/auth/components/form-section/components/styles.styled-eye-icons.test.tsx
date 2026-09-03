import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import breakpointsTheme from '@/components/ui-breakpoints';
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

/**
 * `styled()` runs at module evaluation. Importing the module at file scope evaluates both style
 * callbacks before any test body starts, which leaves them covered by no test at all; the dynamic
 * import defers that evaluation into the first test that asserts on the generated rules.
 */
const renderIcons = async (): Promise<void> => {
  const { StyledEyeIcon, StyledEyeIconOff } =
    await import('@auth/components/form-section/components/styles');

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

// Declared first on purpose: the module is evaluated by the first test that imports it, so
// that test is the only one Stryker credits with covering both `styled()` calls. It has to
// assert on both glyphs, or the second one has no test that can reach it.
describe('password visibility glyph geometry', () => {
  it('pins the 20x24px box on both toggle glyphs', async () => {
    await renderIcons();
    const shown = baseDeclarationOf(SHOW_LABEL);
    const hidden = baseDeclarationOf(HIDE_LABEL);

    expect(shown.getPropertyValue('width')).toBe('20px');
    expect(shown.getPropertyValue('height')).toBe('24px');
    expect(hidden.getPropertyValue('width')).toBe('20px');
    expect(hidden.getPropertyValue('height')).toBe('24px');
  });
});

describe.each([
  ['StyledEyeIcon', SHOW_LABEL],
  ['StyledEyeIconOff', HIDE_LABEL],
])('%s', (_name, label) => {
  it('pins the compact 20x24px glyph box below the md breakpoint', async () => {
    await renderIcons();
    const declaration = baseDeclarationOf(label);

    expect(declaration.getPropertyValue('width')).toBe('20px');
    expect(declaration.getPropertyValue('height')).toBe('24px');
  });

  it('leaves the glyph unfilled so the svg strokes carry the shape', async () => {
    await renderIcons();

    expect(baseDeclarationOf(label).getPropertyValue('fill')).toBe('none');
  });

  it('widens the glyph to 24px from the md breakpoint up', async () => {
    await renderIcons();

    expect(mdDeclarationOf(label).getPropertyValue('width')).toBe('24px');
    expect(baseDeclarationOf(label).getPropertyValue('width')).not.toBe('24px');
  });

  it('overrides only the width at the md breakpoint', async () => {
    await renderIcons();
    const declaration = mdDeclarationOf(label);

    expect(declaration.getPropertyValue('height')).toBe('');
    expect(declaration.getPropertyValue('fill')).toBe('');
  });
});

describe('password visibility toggle glyphs', () => {
  it('keeps both glyphs on one geometry contract so toggling never shifts layout', async () => {
    await renderIcons();
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
