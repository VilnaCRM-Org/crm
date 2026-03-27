import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';

describe('UISkeletonText Integration', () => {
  const getSkeletonText = (): HTMLElement =>
    screen
      .getAllByRole('generic')
      .find((element) => element.id === 'skeleton-text') as HTMLElement;

  it('renders with default size and width', () => {
    expect(React).toBeDefined();
    render(<UISkeletonText id="skeleton-text" />);

    expect(getSkeletonText()).toHaveAttribute('id', 'skeleton-text');
  });

  it('renders with explicit size and width', () => {
    render(<UISkeletonText size="l" width="70%" id="skeleton-text" />);

    const text = getSkeletonText();
    expect(text).toBeInTheDocument();
    expect(text).toHaveStyle({ width: '70%', height: '18px' });
  });

  it('renders with object sx prop', () => {
    render(<UISkeletonText sx={{ mt: 1 }} id="skeleton-text" />);

    expect(getSkeletonText()).toHaveStyle({ marginTop: '8px' });
  });

  it('renders with array sx prop', () => {
    render(<UISkeletonText sx={[{ mt: 1 }, { mb: 2 }]} id="skeleton-text" />);

    expect(getSkeletonText()).toHaveStyle({
      marginTop: '8px',
      marginBottom: '16px',
    });
  });
});
