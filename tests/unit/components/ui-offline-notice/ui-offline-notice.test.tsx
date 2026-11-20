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
    expect(styleRuleFor(status)?.display).toBe('block');
  });

  it('renders as a span so the sibling field wrappers keep their nth-of-type spacing', () => {
    renderWithI18n(<UIOfflineNotice online={false} />);

    const status = screen.getByRole('status');
    expect(status.tagName).toBe('SPAN');
    expect(styleRuleFor(status)?.display).toBe('block');
  });

  it('is focusable by script only and forwards its id and ref', () => {
    const ref = { current: null as HTMLSpanElement | null };
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
    expect(text.tagName).toBe('SPAN');
    expect(screen.getByRole('status').tagName).toBe('SPAN');
    expect(styleRuleFor(text)?.color).toBe('#1B2327');
  });

  it('is a live region by default', () => {
    renderWithI18n(<UIOfflineNotice online live />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
  });

  describe('live={false}', () => {
    it('drops the role and aria-atomic but keeps the id, ref and script focus', () => {
      const ref = { current: null as HTMLSpanElement | null };
      renderWithI18n(<UIOfflineNotice ref={ref} id="offline-notice" online={false} live={false} />);

      const notice = ref.current as HTMLElement;
      expect(notice).toContainElement(screen.getByText(OFFLINE));
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(notice).not.toHaveAttribute('role');
      expect(notice).not.toHaveAttribute('aria-atomic');
      expect(notice).toHaveAttribute('id', 'offline-notice');
      expect(notice).toHaveAttribute('tabindex', '-1');
    });

    it('stays empty and unpadded while online', () => {
      const ref = { current: null as HTMLSpanElement | null };
      renderWithI18n(<UIOfflineNotice ref={ref} online live={false} />);

      expect(ref.current).toBeEmptyDOMElement();
      expect(styleRuleFor(ref.current as HTMLElement)?.padding ?? '').toBe('');
    });

    it('shows the restored copy after a reconnection, then empties', () => {
      const ref = { current: null as HTMLSpanElement | null };
      const { rerender } = renderWithI18n(
        <UIOfflineNotice ref={ref} online={false} live={false} />
      );

      rerender(<UIOfflineNotice ref={ref} online live={false} />);
      expect(ref.current).toHaveTextContent(RESTORED);

      act(() => jest.advanceTimersByTime(5_000));
      expect(ref.current).toBeEmptyDOMElement();
    });
  });

  it('announces the restored connection, then empties the region again', () => {
    const { rerender } = renderWithI18n(<UIOfflineNotice online={false} />);

    rerender(<UIOfflineNotice online />);
    expect(screen.getByRole('status')).toHaveTextContent(RESTORED);

    act(() => jest.advanceTimersByTime(5_000));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
