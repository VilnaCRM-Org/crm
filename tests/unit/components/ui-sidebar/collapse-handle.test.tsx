import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import CollapseHandle from '@/components/ui-sidebar/collapse-handle';
import renderShell from '@tests/unit/utils/render-shell';

jest.mock('@/assets/icons/shell/chevron-left.svg', () => ({
  ReactComponent: ({
    className,
    'aria-hidden': hidden,
  }: {
    className?: string;
    'aria-hidden'?: 'true';
  }): ReactElement => (
    <svg role="img" aria-label="chevron" aria-hidden={hidden} className={className} />
  ),
}));

describe('CollapseHandle', () => {
  it('offers to collapse an expanded sidebar and reports it expanded', () => {
    renderShell(<CollapseHandle layout="desktop" collapsed={false} onToggle={jest.fn()} />);

    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });

    expect(handle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('img', { hidden: true })).toHaveStyle({ transform: 'none' });
  });

  it('offers to expand the rail, reports it collapsed and points its chevron right', () => {
    renderShell(<CollapseHandle layout="desktop" collapsed onToggle={jest.fn()} />);

    const handle = screen.getByRole('button', { name: 'Expand sidebar' });

    expect(handle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('img', { hidden: true })).toHaveStyle({ transform: 'rotate(180deg)' });
  });

  it('speaks uk names', () => {
    renderShell(<CollapseHandle layout="tablet" collapsed={false} onToggle={jest.fn()} />, {
      locale: 'uk',
    });

    expect(screen.getByRole('button', { name: 'Згорнути бічну панель' })).toBeInTheDocument();
  });

  it('runs its handler on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    renderShell(<CollapseHandle layout="desktop" collapsed={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onToggle).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['desktop', false, '223px', '24px'],
    ['desktop', true, '57px', '24px'],
    ['tablet', false, '222px', '32px'],
    ['tablet', true, '60px', '32px'],
  ] as const)(
    'places the %s handle (collapsed %s) at %s, size %s',
    (layout, collapsed, left, size) => {
      renderShell(<CollapseHandle layout={layout} collapsed={collapsed} onToggle={jest.fn()} />);

      expect(screen.getByRole('button')).toHaveStyle({
        left,
        top: '15px',
        width: size,
        height: size,
      });
    }
  );

  it('hides the glyph from assistive technology', () => {
    renderShell(<CollapseHandle layout="desktop" collapsed={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
