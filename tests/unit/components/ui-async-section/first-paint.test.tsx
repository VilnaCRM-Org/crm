import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

import UIAsyncSection from '@/components/ui-async-section';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const NAMESPACE = 'scaffold_probe';

const section = (count: number): JSX.Element => (
  <UIAsyncSection namespace={NAMESPACE} isLoading={false} hasError={false} count={count}>
    <ul>
      <li>loaded child</li>
    </ul>
  </UIAsyncSection>
);

/**
 * A live region is only announced when assistive tech observes it before its content changes, so
 * the region has to paint empty and be filled by the mount effect. `useEffect` never runs in a
 * render-phase pass, and RTL's `render` is act-wrapped and flushes it, so static markup is the
 * only view of the commit that precedes the latch.
 */
const liveRegionTextOnFirstPaint = (count: number): string => {
  const host = document.body.appendChild(document.createElement('div'));
  host.innerHTML = renderToStaticMarkup(section(count));

  const text = within(host).getByRole('status').textContent ?? '';
  host.remove();

  return text;
};

describe('UIAsyncSection first paint', () => {
  it('paints the live region empty before the mount effect arms announcements', () => {
    expect(liveRegionTextOnFirstPaint(1)).toBe('');
  });

  it('paints the live region empty for the empty status too', () => {
    expect(liveRegionTextOnFirstPaint(0)).toBe('');
  });

  it('still paints the resolved section body on that first pass', () => {
    expect(renderToStaticMarkup(section(1))).toContain('loaded child');
  });

  it('fills the same live region node once mounted, rather than replacing it', () => {
    const { rerender } = render(section(1));
    const onMount = screen.getByRole('status');

    expect(onMount).toHaveTextContent(`${NAMESPACE}.loaded`);

    rerender(section(0));

    expect(screen.getByRole('status')).toBe(onMount);
    expect(onMount).toHaveTextContent(`${NAMESPACE}.empty`);
  });
});
