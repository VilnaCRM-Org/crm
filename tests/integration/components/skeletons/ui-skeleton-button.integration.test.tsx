import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';

describe('UISkeletonButton Integration', () => {
  const getSkeletonButton = (): HTMLElement => {
    const el = screen.getAllByRole('generic').find((element) => element.id === 'skeleton-button');
    if (!el) throw new Error('skeleton-button not found in DOM');
    return el;
  };

  it('renders with default props', () => {
    expect(React).toBeDefined();
    render(<UISkeletonButton id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveAttribute('id', 'skeleton-button');
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonButton sx={{ mt: 1 }} id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveStyle({ marginTop: '8px' });
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonButton sx={[{ mt: 1 }, { mb: 2 }]} id="skeleton-button" />);

    expect(getSkeletonButton()).toHaveStyle({
      marginTop: '8px',
      marginBottom: '16px',
    });
  });
});
