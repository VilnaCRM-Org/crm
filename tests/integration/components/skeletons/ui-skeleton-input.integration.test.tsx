import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';

const theme = createTheme();

describe('UISkeletonInput Integration', () => {
  const getSkeletonElements = (): HTMLElement[] =>
    screen.getAllByRole('generic') as HTMLElement[];

  const getSkeletonInput = (): HTMLElement =>
    getSkeletonElements().find((element) => element.id === 'skeleton-input') as HTMLElement;

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
    expect(getSkeletonElements()).toHaveLength(2);
  });

  it('renders exactly one inner placeholder child element', () => {
    render(<UISkeletonInput id="skeleton-input" />);
    expect(getSkeletonElements()).toHaveLength(2);
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
});
