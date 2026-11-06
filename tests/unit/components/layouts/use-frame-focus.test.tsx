import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode, RefCallback } from 'react';
import { MemoryRouter } from 'react-router';

import useFrameFocus from '@/components/layouts/use-frame-focus';

type Entry = NonNullable<Parameters<typeof MemoryRouter>[0]['initialEntries']>[number];
type FrameRef = RefCallback<HTMLElement> | null;

function mountFrameFocus(entry: Entry, refs: FrameRef[]): void {
  renderHook(
    () => {
      refs.push(useFrameFocus());
    },
    {
      wrapper: ({ children }: { children: ReactNode }): JSX.Element => (
        <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
      ),
    }
  );
}

describe('useFrameFocus', () => {
  it('hands out no arrival ref on ordinary navigation', () => {
    const refs: FrameRef[] = [];
    mountFrameFocus('/', refs);

    expect(refs).toEqual([null]);
  });

  it('hands out the arrival ref that focuses the frame after a post-login redirect', () => {
    const refs: FrameRef[] = [];
    mountFrameFocus({ pathname: '/', state: { focusMain: true } }, refs);
    const node = document.createElement('main');
    node.tabIndex = -1;
    document.body.append(node);

    refs[0]?.(node);

    expect(node).toHaveFocus();
    node.remove();
  });
});
