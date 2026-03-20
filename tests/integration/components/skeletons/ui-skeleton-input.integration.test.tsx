/* eslint-disable react/react-in-jsx-scope, testing-library/no-container, testing-library/no-node-access */
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';

const theme = createTheme();

describe('UISkeletonInput integration', () => {
  it('renders with default props', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(document.getElementById('skeleton-input')).toBeInTheDocument();
  });

  it('renders correctly inside ThemeProvider', () => {
    render(
      <ThemeProvider theme={theme}>
        <UISkeletonInput id="skeleton-input" />
      </ThemeProvider>
    );

    const skeletonInput = document.getElementById('skeleton-input');
    expect(skeletonInput).toBeInTheDocument();
    expect(skeletonInput).not.toBeEmptyDOMElement();
  });

  it('renders exactly one inner placeholder child element', () => {
    render(<UISkeletonInput id="skeleton-input" />);
    const skeletonInput = document.getElementById('skeleton-input');

    expect(skeletonInput?.querySelectorAll('.ui-skeleton-input__placeholder')).toHaveLength(1);
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

  it('does not emit test-only data attributes', () => {
    const { container } = render(<UISkeletonInput id="skeleton-input" />);

    expect(container.querySelector('[data-testid]')).toBeNull();
  });
});
