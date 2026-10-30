import { fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import useStickyFocusClearance from '@/components/ui-app-shell/use-sticky-focus-clearance';

function StickyBox(): JSX.Element {
  const onFocus = useStickyFocusClearance();

  return (
    <div role="group" aria-label="Sidebar" onFocus={onFocus}>
      <a href="/boards">Boards</a>
    </div>
  );
}

const placeAt = (element: HTMLElement, top: number, height = 54): void => {
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, height));
};

describe('useStickyFocusClearance', () => {
  let scrollBy: jest.Mock;
  let scrollIntoView: jest.Mock;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    scrollBy = jest.fn();
    scrollIntoView = jest.fn();
    Object.defineProperty(window, 'scrollBy', { configurable: true, value: scrollBy });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);

      return frames.length;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'scrollBy');
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  const focusAt = (top: number): void => {
    render(<StickyBox />);
    const link = screen.getByRole('link', { name: 'Boards' });
    placeAt(link, top);
    fireEvent.focus(link);
  };

  it('measures only in the next frame, after the browser has scrolled the focus into view', () => {
    focusAt(21);

    expect(scrollBy).not.toHaveBeenCalled();
    expect(frames).toHaveLength(1);
  });

  it('scrolls the page up by the part of the focused control the 64 px header covers', () => {
    focusAt(21);
    frames.forEach((frame) => frame(0));

    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: -43 });
  });

  it('rounds a sub-pixel overlap up to a whole pixel', () => {
    focusAt(63.4);
    frames.forEach((frame) => frame(0));

    expect(scrollBy).toHaveBeenCalledWith({ top: -1 });
  });

  it('re-checks once in the next frame and clears the pixel a sticky offset rounded away', () => {
    render(<StickyBox />);
    const link = screen.getByRole('link', { name: 'Boards' });
    jest
      .spyOn(link, 'getBoundingClientRect')
      .mockReturnValueOnce(new DOMRect(0, 10, 100, 54))
      .mockReturnValueOnce(new DOMRect(0, 10, 100, 54))
      .mockReturnValueOnce(new DOMRect(0, 63, 100, 54))
      .mockReturnValueOnce(new DOMRect(0, 63, 100, 54))
      .mockReturnValue(new DOMRect(0, 64, 100, 54));
    fireEvent.focus(link);

    (frames[0] as FrameRequestCallback)(0);
    (frames[1] as FrameRequestCallback)(0);

    expect(scrollBy.mock.calls).toEqual([[{ top: -54 }], [{ top: -1 }]]);
    expect(frames).toHaveLength(2);
  });

  it('gives up after that one follow-up while the header still covers the control', () => {
    focusAt(21);
    for (let index = 0; index < frames.length && index < 5; index += 1) {
      (frames[index] as FrameRequestCallback)(0);
    }

    expect(scrollBy).toHaveBeenCalledTimes(2);
    expect(frames).toHaveLength(2);
  });

  it.each([64, 95])('leaves the page alone for a control whose top is at %i px', (top) => {
    focusAt(top);
    frames.forEach((frame) => frame(0));

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('ignores a control that has no layout box by the time the frame runs', () => {
    render(<StickyBox />);
    const link = screen.getByRole('link', { name: 'Boards' });
    placeAt(link, 10, 0);
    fireEvent.focus(link);
    frames.forEach((frame) => frame(0));

    expect(scrollBy).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('first scrolls the focused control fully into its own list, which Firefox skips', () => {
    focusAt(95);
    frames.forEach((frame) => frame(0));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('link', { name: 'Boards' }));
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('measures the header overlap after the list has revealed the control', () => {
    render(<StickyBox />);
    const link = screen.getByRole('link', { name: 'Boards' });
    placeAt(link, 10);
    scrollIntoView.mockImplementation(() => placeAt(link, 80));
    fireEvent.focus(link);
    frames.forEach((frame) => frame(0));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('measures the element that took focus, not the box that holds the handler', () => {
    render(<StickyBox />);
    const link = screen.getByRole('link', { name: 'Boards' });
    placeAt(link, 10);
    placeAt(screen.getByRole('group', { name: 'Sidebar' }), 200);
    fireEvent.focus(link);
    frames.forEach((frame) => frame(0));

    expect(scrollBy).toHaveBeenCalledWith({ top: -54 });
  });

  it('hands every render the same focus handler', () => {
    const seen: unknown[] = [];
    function Probe(): null {
      seen.push(useStickyFocusClearance());

      return null;
    }
    const { rerender } = render(<Probe />);
    rerender(<Probe />);

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
  });
});
