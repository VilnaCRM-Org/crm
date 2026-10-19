import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

interface ProfileSkeletonModule {
  readonly default: () => JSX.Element;
}

const { default: ProfileSkeleton } = jest.requireActual<ProfileSkeletonModule>(
  '@/modules/user/features/settings/components/user-profile-settings/profile-skeleton'
);

const FIELDS = ['name', 'email', 'current-password', 'new-password'];

const fieldIds = (field: string): string[] => [
  `profile-skeleton-label-${field}`,
  `profile-skeleton-input-${field}`,
];

const isBlock = (node: HTMLElement): boolean => node.id.startsWith('profile-skeleton-');

const hiddenGenerics = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

const blockIds = (): string[] =>
  hiddenGenerics()
    .filter(isBlock)
    .map((node) => node.id);

const skeletonRoots = (): HTMLElement[] =>
  hiddenGenerics().filter((node) => node.getAttribute('aria-hidden') === 'true' && !isBlock(node));

describe('ProfileSkeleton', () => {
  it('mirrors the loaded card: header, two titled sections, the policy, Save and Clear', () => {
    render(<ProfileSkeleton />);

    expect(blockIds()).toEqual([
      'profile-skeleton-monogram',
      'profile-skeleton-greeting',
      'profile-skeleton-name',
      'profile-skeleton-title-personal',
      ...fieldIds('name'),
      ...fieldIds('email'),
      'profile-skeleton-title-password',
      ...fieldIds('current-password'),
      ...fieldIds('new-password'),
      'profile-skeleton-policy',
      'profile-skeleton-save',
      'profile-skeleton-clear',
    ]);
  });

  it('draws each section title on the full-bleed divider of the loaded card', () => {
    render(<ProfileSkeleton />);

    const dividers = hiddenGenerics().filter(
      (node) => styleRuleFor(node)?.getPropertyValue('border-top') === '1px solid #EAECEE'
    );
    const titles = ['personal', 'password'].map((section) =>
      hiddenGenerics().find((node) => node.id === `profile-skeleton-title-${section}`)
    );

    expect(dividers).toHaveLength(3);
    titles.forEach((title, index) => expect(dividers[index]).toContainElement(title ?? null));
    dividers.forEach((divider) =>
      expect(styleRuleFor(divider)?.getPropertyValue('margin-inline')).toContain(
        '--settings-card-inset-start'
      )
    );
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
    expect(blocks).toHaveLength(16);
    blocks.forEach((block) => expect(roots[0]).toContainElement(block));
  });

  it('exposes no node of the skeleton to the accessibility tree', () => {
    render(<ProfileSkeleton />);

    expect(screen.queryAllByRole('generic').filter(isBlock)).toHaveLength(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
