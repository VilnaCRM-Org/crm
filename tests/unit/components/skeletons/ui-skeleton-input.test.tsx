import { render, screen } from '@testing-library/react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import styles from '@/components/skeletons/ui-skeleton-input/styles';

describe('UISkeletonInput', () => {
  const getSkeletonElements = (): HTMLElement[] => screen.getAllByRole('generic') as HTMLElement[];

  const getSkeletonInput = (): HTMLElement =>
    getSkeletonElements().find((element) => element.id === 'skeleton-input') as HTMLElement;

  const getSkeletonPlaceholder = (): HTMLElement =>
    getSkeletonElements().find(
      (element) => element.className.includes('ui-skeleton-input__placeholder')
    ) as HTMLElement;

  it('renders without crashing', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(getSkeletonInput()).toBeInTheDocument();
  });

  it('renders a container and placeholder child', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(getSkeletonInput()).toBeInTheDocument();
    expect(getSkeletonPlaceholder()).toBeInTheDocument();
  });

  it('has no interactive elements', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('has no form elements', () => {
    render(<UISkeletonInput id="skeleton-input" />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  });

  it('renders consistently across re-renders', () => {
    const { rerender } = render(<UISkeletonInput id="skeleton-input" />);
    expect(getSkeletonInput()).toBeInTheDocument();

    rerender(<UISkeletonInput id="skeleton-input" />);
    expect(getSkeletonInput()).toBeInTheDocument();
    expect(getSkeletonPlaceholder()).toBeInTheDocument();
  });

  it('disables animation styles for both container layers when requested', () => {
    render(<UISkeletonInput disableAnimation id="skeleton-input" />);

    const container = getSkeletonInput();
    const placeholder = getSkeletonPlaceholder();

    expect(container).toHaveStyle('animation: none');
    expect(container).toHaveStyle(`background-size: ${styles.staticSkeleton.backgroundSize}`);
    expect(placeholder).toHaveStyle('animation: none');
    expect(placeholder).toHaveStyle(`background-size: ${styles.staticSkeleton.backgroundSize}`);
  });
});
