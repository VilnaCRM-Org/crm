import { render } from '@testing-library/react';

import NotificationIcon from '@/components/ui-notification-content/notification-icon';
import findSvg from '@tests/unit/utils/find-svg';

const CIRCLE =
  'M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12' +
  'C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z';

describe('NotificationIcon', () => {
  it.each([
    ['success', `M7.5 12L10.5 15L16.5 9${CIRCLE}`],
    ['error', `M12 8V12M12 16H12.01${CIRCLE}`],
    ['close', 'M18 6L6 18M6 6L18 18'],
  ] as const)('draws the %s glyph as a currentColor stroke', (kind, path) => {
    const { container } = render(<NotificationIcon kind={kind} />);
    const markup = container.innerHTML;

    expect(markup.match(/<path\b/g)).toHaveLength(1);
    expect(markup).toContain(`d="${path}"`);
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('stroke-width="2"');
    expect(markup).toContain('stroke-linecap="round"');
    expect(markup).toContain('stroke-linejoin="round"');
    expect(markup).toContain('viewBox="0 0 24 24"');
  });

  it.each(['success', 'error', 'close'] as const)(
    'hides the %s glyph from assistive technology and takes no focus',
    (kind) => {
      const { container } = render(<NotificationIcon kind={kind} />);
      const icon = findSvg(container);

      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
    }
  );

  it('takes the size of the caller through the inherited font size', () => {
    const { container } = render(
      <span style={{ fontSize: '1.5rem' }}>
        <NotificationIcon kind="success" />
      </span>
    );

    expect(findSvg(container)).toHaveClass('MuiSvgIcon-fontSizeInherit');
  });

  it.each([
    ['success', '#2E7D32'],
    ['error', '#DC3939'],
  ] as const)('colours the %s glyph %s', (kind, color) => {
    const { container } = render(<NotificationIcon kind={kind} />);

    expect(findSvg(container)).toHaveStyle({ color });
  });

  it('leaves the close glyph to the colour of the control that holds it', () => {
    const { container } = render(
      <span style={{ color: 'rgb(1, 2, 3)' }}>
        <NotificationIcon kind="close" />
      </span>
    );

    expect(findSvg(container)).toHaveStyle({
      color: 'rgb(1, 2, 3)',
    });
  });
});
