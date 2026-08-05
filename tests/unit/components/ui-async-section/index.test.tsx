// @jest-environment jsdom

import '../../utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import UIAsyncSection from '@/components/ui-async-section';

import renderWithProviders from '../../utils/render-with-providers';

const NAMESPACE = 'scaffold_probe';

const renderSection = (
  overrides: Partial<{ isLoading: boolean; hasError: boolean; count: number }> = {}
): void => {
  const { isLoading = false, hasError = false, count = 1 } = overrides;
  renderWithProviders(
    <UIAsyncSection namespace={NAMESPACE} isLoading={isLoading} hasError={hasError} count={count}>
      <ul>
        <li>loaded child</li>
      </ul>
    </UIAsyncSection>
  );
};

describe('UIAsyncSection', () => {
  it('renders the namespaced title as the page heading', () => {
    renderSection();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${NAMESPACE}.title`);
  });

  it('renders the children and announces the loaded status when items exist', () => {
    renderSection();

    expect(screen.getByText('loaded child')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`${NAMESPACE}.loaded`);
  });

  it('replaces the children with the loading status while loading', () => {
    renderSection({ isLoading: true });

    expect(screen.queryByText('loaded child')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`${NAMESPACE}.loading`);
  });

  it('reports the error status and hides the children when loading failed', () => {
    renderSection({ hasError: true });

    expect(screen.queryByText('loaded child')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`${NAMESPACE}.error`);
  });

  it('reports the empty status when the load succeeded with no items', () => {
    renderSection({ count: 0 });

    expect(screen.queryByText('loaded child')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`${NAMESPACE}.empty`);
  });

  it('prefers the loading status over the error status while both are set', () => {
    renderSection({ isLoading: true, hasError: true });

    expect(screen.getByRole('status')).toHaveTextContent(`${NAMESPACE}.loading`);
  });
});
