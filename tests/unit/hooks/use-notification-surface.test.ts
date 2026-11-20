import { renderHook } from '@testing-library/react';

import useNotificationSurface from '@/hooks/use-notification-surface';
import type { NotificationSurface } from '@/lib/notifications/types/notification-surface';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

const SURFACES: readonly NotificationSurface[] = ['page', 'anchor', 'header'];

const MATCHING = [
  ['toast', 'page'],
  ['inline', 'anchor'],
  ['bell', 'header'],
] as const;

const NINE_ROWS = MATCHING.flatMap(([style, active]) =>
  SURFACES.map((surface) => [style, surface, surface === active] as const)
);

describe('useNotificationSurface', () => {
  beforeEach(() => clearConfigBlock());

  afterAll(() => clearConfigBlock());

  it('has nine rows, one active surface per style', () => {
    expect(NINE_ROWS).toHaveLength(9);
    expect(NINE_ROWS.filter(([, , active]) => active)).toHaveLength(3);
  });

  it.each(NINE_ROWS)('under %s the %s surface is active: %s', (style, surface, expected) => {
    writeConfigBlock(JSON.stringify({ notificationStyle: style }));

    const { result } = renderHook(() => useNotificationSurface(surface));

    expect(result.current).toBe(expected);
  });

  it.each(SURFACES)('with no style key only the page surface is active (%s)', (surface) => {
    writeConfigBlock(JSON.stringify({ flags: {} }));

    const { result } = renderHook(() => useNotificationSurface(surface));

    expect(result.current).toBe(surface === 'page');
  });

  it('treats a missing block like the default style', () => {
    const { result } = renderHook(() => useNotificationSurface('page'));

    expect(result.current).toBe(true);
  });
});
