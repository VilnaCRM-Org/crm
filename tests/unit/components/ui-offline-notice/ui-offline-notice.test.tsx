import { act, screen } from '@testing-library/react';

import UIOfflineNotice from '@/components/ui-offline-notice';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import renderWithI18n from '@tests/unit/utils/render-with-i18n';

const OFFLINE = 'You are offline. Submitting is unavailable until your connection is restored.';
const RESTORED = 'Connection restored.';

describe('UIOfflineNotice', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps an empty, unpadded status region mounted while online', () => {
    renderWithI18n(<UIOfflineNotice online />);

    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(styleRuleFor(status)?.padding ?? '').toBe('');
    expect(styleRuleFor(status)?.outline).toBe('none');
  });

  it('is focusable by script only and forwards its id and ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    renderWithI18n(<UIOfflineNotice ref={ref} id="offline-notice" online={false} />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('tabindex', '-1');
    expect(status).toHaveAttribute('id', 'offline-notice');
    expect(ref.current).toBe(status);
    expect(styleRuleFor(status, ':focus-visible')?.outline).toBe('2px solid #0074B5');
  });

  it('renders the offline copy inside the same status region while offline', () => {
    const { rerender } = renderWithI18n(<UIOfflineNotice online />);
    const status = screen.getByRole('status');

    rerender(<UIOfflineNotice online={false} />);

    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent(OFFLINE);
    expect(styleRuleFor(status)?.padding).toBe('0.75rem 1rem');
  });

  it('gives the notice text an explicit, dark colour', () => {
    renderWithI18n(<UIOfflineNotice online={false} />);

    const text = screen.getByText(OFFLINE);
    expect(text.tagName).toBe('P');
    expect(styleRuleFor(text)?.color).toBe('#1B2327');
  });

  it('announces the restored connection, then empties the region again', () => {
    const { rerender } = renderWithI18n(<UIOfflineNotice online={false} />);

    rerender(<UIOfflineNotice online />);
    expect(screen.getByRole('status')).toHaveTextContent(RESTORED);

    act(() => jest.advanceTimersByTime(5_000));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
