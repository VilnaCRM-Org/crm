/* eslint-disable react/react-in-jsx-scope, testing-library/no-container, testing-library/no-node-access */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';

describe('UISkeletonButton integration', () => {
  it('renders with default props', () => {
    render(<UISkeletonButton id="skeleton-button" />);

    expect(document.getElementById('skeleton-button')).toBeInTheDocument();
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonButton id="skeleton-button" sx={{ mt: 1 }} />);

    expect(document.getElementById('skeleton-button')).toBeInTheDocument();
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonButton id="skeleton-button" sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect(document.getElementById('skeleton-button')).toBeInTheDocument();
  });

  it('does not emit test-only data attributes', () => {
    const { container } = render(<UISkeletonButton id="skeleton-button" />);

    expect(container.querySelector('[data-testid]')).toBeNull();
  });
});
