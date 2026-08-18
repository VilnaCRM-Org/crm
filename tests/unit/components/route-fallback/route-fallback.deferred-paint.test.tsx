// @jest-environment jsdom

import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import RouteFallback from '@/components/route-fallback';

const SHOW_DELAY_MS = 150;
const WRAPPER_MIN_HEIGHT = '50vh';
const PILL_BORDER_RADIUS = '57px';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

function paintedBy(property: 'minHeight' | 'borderRadius', value: string): HTMLElement[] {
  return screen
    .queryAllByRole('generic')
    .filter((element) => window.getComputedStyle(element)[property] === value);
}

function loaderWrappers(): HTMLElement[] {
  return paintedBy('minHeight', WRAPPER_MIN_HEIGHT);
}

function loaderPills(): HTMLElement[] {
  return paintedBy('borderRadius', PILL_BORDER_RADIUS);
}

describe('RouteFallback deferred paint', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('paints no loader at all until the delay has fully elapsed', () => {
    render(<RouteFallback />);

    expect(loaderWrappers()).toHaveLength(0);
    expect(loaderPills()).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(SHOW_DELAY_MS - 1);
    });

    expect(loaderWrappers()).toHaveLength(0);
    expect(loaderPills()).toHaveLength(0);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('paints the grey pill spinner once the delay elapses', () => {
    render(<RouteFallback />);

    act(() => {
      jest.advanceTimersByTime(SHOW_DELAY_MS);
    });

    expect(loaderWrappers()).toHaveLength(1);
    expect(loaderPills()).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('route_fallback.loading');
  });

  it('clears the pending paint timer when the route resolves before the delay', () => {
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

    const view = render(<RouteFallback />);
    expect(jest.getTimerCount()).toBe(1);

    view.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
