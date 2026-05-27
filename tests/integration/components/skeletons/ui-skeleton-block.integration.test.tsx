import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';

describe('UISkeletonBlock Integration', () => {
  const getSkeletonBlock = (): HTMLElement => {
    const element = screen.getAllByRole('generic').find((el) => el.id === 'skeleton-block');
    if (!element) throw new Error('Skeleton block element with id "skeleton-block" not found');
    return element;
  };

  it('renders with default props', () => {
    expect(React).toBeDefined();
    render(<UISkeletonBlock id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveAttribute('id', 'skeleton-block');
  });

  it('renders with custom dimensions', () => {
    render(<UISkeletonBlock width="200px" height="4rem" borderRadius="12px" id="skeleton-block" />);

    const block = getSkeletonBlock();
    expect(block).toBeInTheDocument();
    expect(block).toHaveStyle({ width: '200px', height: '4rem', borderRadius: '12px' });
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonBlock sx={{ mt: 1 }} id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveStyle({ marginTop: '8px' });
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonBlock sx={[{ mt: 1 }, { mb: 2 }]} id="skeleton-block" />);

    expect(getSkeletonBlock()).toHaveStyle({
      marginTop: '8px',
      marginBottom: '16px',
    });
  });
});
