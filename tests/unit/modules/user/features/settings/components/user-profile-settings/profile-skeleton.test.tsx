import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

interface ProfileSkeletonModule {
  readonly default: () => JSX.Element;
}

const { default: ProfileSkeleton } = jest.requireActual<ProfileSkeletonModule>(
  '@/modules/user/features/settings/components/user-profile-settings/profile-skeleton'
);

const FIELDS = ['name', 'email', 'current-password', 'new-password'];

const FIELD_IDS = FIELDS.flatMap((field) => [
  `profile-skeleton-label-${field}`,
  `profile-skeleton-input-${field}`,
]);

const isBlock = (node: HTMLElement): boolean => node.id.startsWith('profile-skeleton-');

const hiddenGenerics = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

const blockIds = (): string[] =>
  hiddenGenerics()
    .filter(isBlock)
    .map((node) => node.id);

const skeletonRoots = (): HTMLElement[] =>
  hiddenGenerics().filter((node) => node.getAttribute('aria-hidden') === 'true' && !isBlock(node));

describe('ProfileSkeleton', () => {
  it('draws the header, a label and an input per field, and the save button, in order', () => {
    render(<ProfileSkeleton />);

    expect(blockIds()).toEqual([
      'profile-skeleton-monogram',
      'profile-skeleton-greeting',
      'profile-skeleton-name',
      ...FIELD_IDS,
      'profile-skeleton-save',
    ]);
  });

  it.each(FIELDS)('gives the %s row a label placeholder followed by its input', (field) => {
    render(<ProfileSkeleton />);

    const ids = blockIds();
    const label = ids.indexOf(`profile-skeleton-label-${field}`);

    expect(label).toBeGreaterThan(-1);
    expect(ids[label + 1]).toBe(`profile-skeleton-input-${field}`);
  });

  it('hides every block under one aria-hidden root', () => {
    render(<ProfileSkeleton />);

    const roots = skeletonRoots();
    const blocks = hiddenGenerics().filter(isBlock);

    expect(roots).toHaveLength(1);
    expect(blocks).toHaveLength(12);
    blocks.forEach((block) => expect(roots[0]).toContainElement(block));
  });

  it('exposes no node of the skeleton to the accessibility tree', () => {
    render(<ProfileSkeleton />);

    expect(screen.queryAllByRole('generic').filter(isBlock)).toHaveLength(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
