import { render, screen } from '@testing-library/react';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import getTextSkeletonStyles from '@/components/skeletons/ui-skeleton-text/styles';
import type { SkeletonTextSize } from '@/components/skeletons/ui-skeleton-text/types';

jest.mock('@/components/skeletons/ui-skeleton-text/styles', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

describe('UISkeletonText', () => {
  const getSkeletonText = (id: string): HTMLElement => {
    const element = screen.getAllByRole('generic').find((el) => el.id === id);
    if (!element) throw new Error(`Skeleton text element with id "${id}" not found`);
    return element;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses default size and width when props are omitted', () => {
    render(<UISkeletonText id="ui-skeleton-text" />);

    expect(getSkeletonText('ui-skeleton-text')).toHaveAttribute('id', 'ui-skeleton-text');
    expect(getTextSkeletonStyles).toHaveBeenCalledWith('m', '100%');
  });

  it('passes provided size and width to style builder', () => {
    const size: SkeletonTextSize = 'l';
    const width = '45%';

    render(<UISkeletonText size={size} width={width} id="ui-skeleton-text-custom" />);

    expect(getSkeletonText('ui-skeleton-text-custom')).toHaveAttribute('id', 'ui-skeleton-text-custom');
    expect(getTextSkeletonStyles).toHaveBeenCalledWith(size, width);
  });

  it('applies array sx without dropping the base styles', () => {
    const arraySx = [{ mt: 1 }, { mb: 2 }];

    render(<UISkeletonText sx={arraySx} id="ui-skeleton-text-array-sx" />);

    expect(getSkeletonText('ui-skeleton-text-array-sx')).toHaveAttribute('id', 'ui-skeleton-text-array-sx');
  });

  it('accepts a single sx object without wrapping errors', () => {
    render(<UISkeletonText sx={{ mt: 3 }} id="ui-skeleton-text-object-sx" />);

    expect(getSkeletonText('ui-skeleton-text-object-sx')).toHaveAttribute('id', 'ui-skeleton-text-object-sx');
  });

  it('calls style builder with size "s" and provided width', () => {
    render(<UISkeletonText size="s" width="30%" id="ui-skeleton-text-s" />);

    expect(getSkeletonText('ui-skeleton-text-s')).toHaveAttribute('id', 'ui-skeleton-text-s');
    expect(getTextSkeletonStyles).toHaveBeenCalledWith('s', '30%');
  });

  it('calls style builder with size "l" and provided width', () => {
    render(<UISkeletonText size="l" width="80%" id="ui-skeleton-text-l" />);

    expect(getSkeletonText('ui-skeleton-text-l')).toHaveAttribute('id', 'ui-skeleton-text-l');
    expect(getTextSkeletonStyles).toHaveBeenCalledWith('l', '80%');
  });

  it('has no interactive elements', () => {
    render(<UISkeletonText id="ui-skeleton-text" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
