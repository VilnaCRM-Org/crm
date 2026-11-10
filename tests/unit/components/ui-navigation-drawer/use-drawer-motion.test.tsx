import { renderHook } from '@testing-library/react';

import useDrawerMotion from '@/components/ui-navigation-drawer/use-drawer-motion';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

describe('useDrawerMotion', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('slides and fades over 200 ms by default', () => {
    stubMotionPreference(false);

    expect(renderHook(() => useDrawerMotion()).result.current).toBe(200);
  });

  it('drops the motion to 0 ms under prefers-reduced-motion: reduce', () => {
    stubMotionPreference(true);

    expect(renderHook(() => useDrawerMotion()).result.current).toBe(0);
  });
});
