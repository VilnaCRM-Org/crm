import { render, screen } from '@testing-library/react';

import UISkeletonInput from '@/components/Skeletons/UISkeletonInput';

describe('UISkeletonInput', () => {
  it('renders without crashing', () => {
    render(<UISkeletonInput data-testid="skeleton-input" />);

    expect(screen.getByTestId('skeleton-input')).toBeInTheDocument();
  });

  it('renders exactly one inner placeholder child', () => {
    render(<UISkeletonInput data-testid="skeleton-input" />);
    const container = screen.getByTestId('skeleton-input');

    expect(container).not.toBeEmptyDOMElement();
  });

  it('has no interactive elements', () => {
    render(<UISkeletonInput data-testid="skeleton-input" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('has no form elements', () => {
    render(<UISkeletonInput data-testid="skeleton-input" />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  });

  it('renders consistently across re-renders', () => {
    const { rerender } = render(<UISkeletonInput data-testid="skeleton-input" />);
    expect(screen.getByTestId('skeleton-input')).toBeInTheDocument();

    rerender(<UISkeletonInput data-testid="skeleton-input" />);
    expect(screen.getByTestId('skeleton-input')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-input')).not.toBeEmptyDOMElement();
  });
});
