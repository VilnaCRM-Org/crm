import { renderHook } from '@testing-library/react';

import type { NavigationItemSet } from '@/components/types/ui-app-shell/navigation-item';
import useAvailableNavigationItems from '@/components/ui-navigation-list/use-available-items';
import featureFlagService from '@/config/runtime/feature-flag-service';

const icon = 'svg' as unknown as NavigationItemSet['items'][number]['icon'];

const set: NavigationItemSet = {
  items: [
    { id: 'boards', href: '/boards', labelKey: 'a', icon },
    {
      id: 'settings',
      href: '/settings',
      labelKey: 'b',
      icon,
      flag: 'userSettings',
      children: {
        items: [
          {
            id: 'integrations',
            href: '/settings/integrations',
            labelKey: 'c',
            icon,
            flag: 'userSettings',
          },
          { id: 'billing', href: '/settings/billing', labelKey: 'd', icon },
        ],
      },
    },
  ],
};

const idsOf = (available: NavigationItemSet): string[] =>
  Array.from(JSON.stringify(available).matchAll(/"id":"(\w+)"/gu), ([, id]) => id as string);

describe('useAvailableNavigationItems', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('drops a flagged group together with its sub-items while the flag is off', () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(false);

    const { result } = renderHook(() => useAvailableNavigationItems(set));

    expect(idsOf(result.current)).toEqual(['boards']);
  });

  it('keeps the group and its sub-items while the flag is on', () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);

    const { result } = renderHook(() => useAvailableNavigationItems(set));

    expect(idsOf(result.current)).toEqual(['boards', 'settings', 'integrations', 'billing']);
  });

  it('asks the service for the flag of the item, and never for an unflagged one', () => {
    const isEnabled = jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);

    renderHook(() => useAvailableNavigationItems(set));

    expect(isEnabled).toHaveBeenCalledWith('userSettings');
    expect(isEnabled).toHaveBeenCalledTimes(2);
  });

  it('filters a sub-item on its own flag inside an available group', () => {
    jest
      .spyOn(featureFlagService, 'isEnabled')
      .mockImplementation((flag) => flag !== 'userSettings');
    const unflaggedGroup: NavigationItemSet = {
      items: [
        {
          id: 'settings',
          href: '/settings',
          labelKey: 'b',
          icon,
          children: {
            items: [
              { id: 'integrations', href: '/x', labelKey: 'c', icon, flag: 'userSettings' },
              { id: 'billing', href: '/y', labelKey: 'd', icon },
            ],
          },
        },
      ],
    };

    const { result } = renderHook(() => useAvailableNavigationItems(unflaggedGroup));

    expect(idsOf(result.current)).toEqual(['settings', 'billing']);
  });

  it('returns the same set while the input is the same', () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const { result, rerender } = renderHook(() => useAvailableNavigationItems(set));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
