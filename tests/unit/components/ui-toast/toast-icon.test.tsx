import { render } from '@testing-library/react';

import ToastIcon from '@/components/ui-toast/toast-icon';

describe('ToastIcon', () => {
  it.each([
    ['check', 'M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22'],
    ['alert', 'M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22'],
    ['close', 'M18 6L6 18M6 6L18 18'],
  ] as const)('draws the %s glyph as a currentColor stroke', (name, pathStart) => {
    const { container } = render(<ToastIcon name={name} />);

    expect(container.innerHTML).toContain(`d="${pathStart}`);
    expect(container.innerHTML).toContain('stroke="currentColor"');
    expect(container.innerHTML).toContain('fill="none"');
    expect(container.innerHTML).toContain('stroke-width="2"');
    expect(container.innerHTML).toContain('stroke-linecap="round"');
    expect(container.innerHTML).toContain('stroke-linejoin="round"');
    expect(container.innerHTML).toContain('aria-hidden="true"');
    expect(container.innerHTML).toContain('viewBox="0 0 24 24"');
  });
});
