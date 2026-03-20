/* eslint-disable react/react-in-jsx-scope, testing-library/no-container, testing-library/no-node-access */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';

describe('UISkeletonBlock integration', () => {
  it('renders with default props', () => {
    render(<UISkeletonBlock id="skeleton-block" />);

    expect(document.getElementById('skeleton-block')).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(<UISkeletonBlock id="skeleton-block" width="200px" height="4rem" borderRadius="12px" />);

    expect(document.getElementById('skeleton-block')).toBeInTheDocument();
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonBlock id="skeleton-block" sx={{ mt: 1 }} />);

    expect(document.getElementById('skeleton-block')).toBeInTheDocument();
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonBlock id="skeleton-block" sx={[{ mt: 1 }, { mb: 2 }]} />);

    expect(document.getElementById('skeleton-block')).toBeInTheDocument();
  });

  it('does not emit test-only data attributes', () => {
    const { container } = render(<UISkeletonBlock id="skeleton-block" />);

    expect(container.querySelector('[data-testid]')).toBeNull();
  });
});
