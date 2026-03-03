import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';

import UISkeletonInput from '@/components/Skeletons/UISkeletonInput';

const theme = createTheme();

describe('UISkeletonInput Integration', () => {
  it('renders with default props', () => {
    render(<UISkeletonInput data-testid="skeleton-input" />);

    expect(screen.getByTestId('skeleton-input')).toBeInTheDocument();
  });

  it('renders correctly inside ThemeProvider', () => {
    // inputContainer style is a theme function — verify it resolves without error
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput data-testid="skeleton-input" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('skeleton-input')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-input')).not.toBeEmptyDOMElement();
  });

  it('renders exactly one inner placeholder child element', () => {
    render(<UISkeletonInput data-testid="skeleton-input" />);
    const container = screen.getByTestId('skeleton-input');

    expect(within(container).getAllByTestId('skeleton-placeholder')).toHaveLength(1);
  });

  it('has no interactive elements during loading', () => {
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput data-testid="skeleton-input" />
      </ThemeProvider>
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
