import { render, screen } from '@testing-library/react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import AuthSkeleton from '@/modules/user/features/auth/components/auth-skeleton';

jest.mock('@/components/skeletons/ui-skeleton-block', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@/components/skeletons/ui-skeleton-button', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@/components/skeletons/ui-skeleton-input', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@/components/skeletons/ui-skeleton-text', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe('AuthSkeleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering structure', () => {
    it('renders the component without crashing', () => {
      render(<AuthSkeleton />);

      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('renders the expected skeleton elements', () => {
      render(<AuthSkeleton />);

      const textCalls = (UISkeletonText as unknown as jest.Mock).mock.calls.map(([props]) => props);
      const inputCalls = (UISkeletonInput as unknown as jest.Mock).mock.calls.map(([props]) => props);
      const buttonCalls = (UISkeletonButton as unknown as jest.Mock).mock.calls.map(([props]) => props);
      const blockCalls = (UISkeletonBlock as unknown as jest.Mock).mock.calls.map(([props]) => props);

      expect(textCalls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'auth-skeleton-title',
          }),
          expect.objectContaining({
            id: 'auth-skeleton-subtitle',
          }),
          expect.objectContaining({
            id: 'auth-skeleton-subtitle-line2',
          }),
          expect.objectContaining({
            id: 'auth-skeleton-switcher',
          }),
        ])
      );
      expect(
        textCalls.filter((props) => props.id?.startsWith('auth-skeleton-field-label-'))
      ).toHaveLength(3);
      expect(
        inputCalls.filter((props) => props.id?.startsWith('auth-skeleton-input-'))
      ).toHaveLength(3);
      expect(buttonCalls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'auth-skeleton-submit',
          }),
        ])
      );
      expect(
        blockCalls.filter((props) => props.id?.startsWith('auth-skeleton-social-'))
      ).toHaveLength(4);
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('does not pass test-only data attributes to the skeleton building blocks', () => {
      render(<AuthSkeleton />);

      const textCalls = (UISkeletonText as unknown as jest.Mock).mock.calls.map(([props]) => props);
      const inputCalls = (UISkeletonInput as unknown as jest.Mock).mock.calls.map(([props]) => props);
      const buttonCalls = (UISkeletonButton as unknown as jest.Mock).mock.calls.map(([props]) => props);
      const blockCalls = (UISkeletonBlock as unknown as jest.Mock).mock.calls.map(([props]) => props);

      expect(textCalls.every((props) => props['data-testid'] === undefined)).toBe(true);
      expect(inputCalls.every((props) => props['data-testid'] === undefined)).toBe(true);
      expect(buttonCalls.every((props) => props['data-testid'] === undefined)).toBe(true);
      expect(blockCalls.every((props) => props['data-testid'] === undefined)).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('exposes the loading region label and keeps the divider decorative', () => {
      render(<AuthSkeleton />);

      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Loading authentication form'
      );
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('does not render interactive or form controls', () => {
      render(<AuthSkeleton />);

      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.queryAllByRole('textbox')).toHaveLength(0);
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
      expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    });
  });

  describe('Component behavior', () => {
    it('renders consistently across rerenders', () => {
      const { rerender } = render(<AuthSkeleton />);

      expect(screen.getByRole('presentation')).toBeInTheDocument();

      rerender(<AuthSkeleton />);

      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });
  });
});
