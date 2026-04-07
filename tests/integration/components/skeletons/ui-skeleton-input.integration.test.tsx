import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import styles from '@/components/skeletons/ui-skeleton-input/styles';

const theme = createTheme();

describe('UISkeletonInput Integration', () => {
  const getSkeletonInput = (): HTMLElement => {
    const element = screen.getAllByRole('generic').find((node) => node.id === 'skeleton-input');
    if (!element) throw new Error('skeleton-input not found');
    return element;
  };

  const getSkeletonElements = (): HTMLElement[] =>
    within(getSkeletonInput()).getAllByRole('generic') as HTMLElement[];

  const getSkeletonPlaceholders = (): HTMLElement[] =>
    getSkeletonElements().filter(
      (element) => element.classList.contains('ui-skeleton-input__placeholder')
    );

  const getSkeletonPlaceholder = (): HTMLElement => {
    const placeholder = getSkeletonPlaceholders()[0];
    if (!placeholder) throw new Error('ui-skeleton-input__placeholder not found');
    return placeholder;
  };

  it('renders with default props', () => {
    expect(React).toBeDefined();
    render(<UISkeletonInput id="skeleton-input" />);

    expect(getSkeletonInput()).toBeInTheDocument();
  });

  it('renders correctly inside ThemeProvider', () => {
    // inputContainer style is a theme function — verify it resolves without error
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput id="skeleton-input" />
      </ThemeProvider>
    );

    expect(getSkeletonInput()).toBeInTheDocument();
    expect(getSkeletonPlaceholder()).toBeInTheDocument();
  });

  it('renders exactly one inner placeholder child element', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(getSkeletonInput()).toBeInTheDocument();
    expect(getSkeletonPlaceholders()).toHaveLength(1);
  });

  it('has no interactive elements during loading', () => {
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput id="skeleton-input" />
      </ThemeProvider>
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('applies static styles when animation is disabled', () => {
    render(<UISkeletonInput disableAnimation id="skeleton-input" />);

    expect(getSkeletonInput()).toHaveStyle({ backgroundSize: styles.staticSkeleton.backgroundSize });
    expect(getSkeletonPlaceholder()).toHaveStyle({ backgroundSize: styles.staticSkeleton.backgroundSize });
  });
});
