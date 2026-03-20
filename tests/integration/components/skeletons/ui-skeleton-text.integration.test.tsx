/* eslint-disable react/react-in-jsx-scope, testing-library/no-container, testing-library/no-node-access */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';

describe('UISkeletonText integration', () => {
  it('renders with default size and width', () => {
    render(<UISkeletonText id="skeleton-text" />);

    expect(document.getElementById('skeleton-text')).toBeInTheDocument();
  });

  it('renders with explicit size and width', () => {
    render(<UISkeletonText id="skeleton-text" size="l" width="70%" />);

    expect(document.getElementById('skeleton-text')).toBeInTheDocument();
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonText id="skeleton-text" sx={{ mt: 1 }} />);

    expect(document.getElementById('skeleton-text')).toBeInTheDocument();
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonText id="skeleton-text" sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect(document.getElementById('skeleton-text')).toBeInTheDocument();
  });

  it('does not emit test-only data attributes', () => {
    const { container } = render(<UISkeletonText id="skeleton-text" />);

    expect(container.querySelector('[data-testid]')).toBeNull();
  });
});
