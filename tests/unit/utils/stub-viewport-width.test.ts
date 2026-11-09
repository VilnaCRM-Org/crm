import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

describe('stubViewportWidth', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('answers min- and max-width queries from the stubbed width', () => {
    stubViewportWidth(1024);

    expect(window.matchMedia('(min-width:1024px)').matches).toBe(true);
    expect(window.matchMedia('(min-width:1440px)').matches).toBe(false);
    expect(window.matchMedia('(max-width:1023.95px)').matches).toBe(false);
  });

  it('keeps a reduced-motion preference stubbed before it', () => {
    stubMotionPreference(true);
    stubViewportWidth(375);

    expect(window.matchMedia(REDUCED_MOTION).matches).toBe(true);
    expect(window.matchMedia('(min-width:1024px)').matches).toBe(false);
  });

  it('answers a non-width query false when nothing was stubbed before', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    stubViewportWidth(375);

    expect(window.matchMedia(REDUCED_MOTION).matches).toBe(false);
  });
});
