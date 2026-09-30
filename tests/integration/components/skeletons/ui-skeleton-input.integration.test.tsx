import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const theme = createTheme({ palette: { background: { default: '#fafafa' } } });
const PLACEHOLDER_CLASS = 'ui-skeleton-input__placeholder';

describe('UISkeletonInput Integration', () => {
  const hiddenGenerics = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

  const getSkeletonInput = (): HTMLElement => {
    const element = hiddenGenerics().find((node) => node.id === 'skeleton-input');
    if (!element) throw new Error('skeleton-input not found');
    return element;
  };

  const getSkeletonPlaceholders = (): HTMLElement[] =>
    hiddenGenerics().filter((element) => element.classList.contains(PLACEHOLDER_CLASS));

  const getSkeletonPlaceholder = (): HTMLElement => {
    const [placeholder] = getSkeletonPlaceholders();
    if (!placeholder) throw new Error(`${PLACEHOLDER_CLASS} not found`);
    return placeholder;
  };

  it('renders a decorative field hidden from assistive technology', () => {
    expect(React).toBeDefined();
    render(<UISkeletonInput id="skeleton-input" />);

    expect(getSkeletonInput()).toHaveAttribute('aria-hidden', 'true');
  });

  it('paints the field interior with the ambient theme background', () => {
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput id="skeleton-input" />
      </ThemeProvider>
    );

    expect(styleRuleFor(getSkeletonInput(), '::after')?.getPropertyValue('background-color')).toBe(
      '#fafafa'
    );
    expect(getSkeletonPlaceholder()).toHaveStyle({ position: 'absolute', width: '9.1875rem' });
  });

  it('renders exactly one inner placeholder child element', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(getSkeletonPlaceholders()).toHaveLength(1);
  });

  it('has no interactive elements during loading', () => {
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput id="skeleton-input" />
      </ThemeProvider>
    );

    expect(screen.queryAllByRole('button', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('link', { hidden: true })).toHaveLength(0);
    expect(screen.queryAllByRole('textbox', { hidden: true })).toHaveLength(0);
  });

  it('applies static styles to both layers when animation is disabled', () => {
    render(<UISkeletonInput disableAnimation id="skeleton-input" />);

    expect(getSkeletonInput()).toHaveStyle({ animation: 'none', backgroundSize: '100% 100%' });
    expect(getSkeletonPlaceholder()).toHaveStyle({
      animation: 'none',
      backgroundSize: '100% 100%',
    });
  });
});
