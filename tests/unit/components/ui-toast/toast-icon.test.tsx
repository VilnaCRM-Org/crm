import { render } from '@testing-library/react';

import ToastIcon from '@/components/ui-toast/toast-icon';

const CIRCLE =
  'M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12' +
  'C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z';

describe('ToastIcon', () => {
  it.each([
    ['check', `M7.5 12L10.5 15L16.5 9${CIRCLE}`],
    ['alert', `M12 8V12M12 16H12.01${CIRCLE}`],
    ['close', 'M18 6L6 18M6 6L18 18'],
  ] as const)('draws the %s glyph as a currentColor stroke', (name, path) => {
    const { container } = render(<ToastIcon name={name} />);
    const markup = container.innerHTML;

    expect(markup.match(/<path\b/g)).toHaveLength(1);
    expect(markup).toContain(`d="${path}"`);
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('stroke-width="2"');
    expect(markup).toContain('stroke-linecap="round"');
    expect(markup).toContain('stroke-linejoin="round"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('viewBox="0 0 24 24"');
  });
});
