import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import MenuToggleButton from '@/components/ui-app-header/menu-toggle-button';
import renderShell from '@tests/unit/utils/render-shell';

describe('MenuToggleButton', () => {
  it('is the Open menu button of a closed drawer, with no aria-controls', () => {
    renderShell(<MenuToggleButton open={false} controls="drawer-1" onToggle={jest.fn()} />);

    const burger = screen.getByRole('button', { name: 'Open menu' });

    expect(burger).toHaveAttribute('aria-expanded', 'false');
    expect(burger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(burger).not.toHaveAttribute('aria-controls');
  });

  it('points aria-controls at the drawer while it is open', () => {
    renderShell(<MenuToggleButton open controls="drawer-1" onToggle={jest.fn()} />);

    const burger = screen.getByRole('button', { name: 'Open menu' });

    expect(burger).toHaveAttribute('aria-expanded', 'true');
    expect(burger).toHaveAttribute('aria-controls', 'drawer-1');
  });

  it('speaks uk', () => {
    renderShell(<MenuToggleButton open={false} onToggle={jest.fn()} />, { locale: 'uk' });

    expect(screen.getByRole('button', { name: 'Відкрити меню' })).toBeInTheDocument();
  });

  it('runs its handler on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    renderShell(<MenuToggleButton open={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onToggle).toHaveBeenCalledTimes(3);
  });

  it('forwards its ref to the button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderShell(<MenuToggleButton open={false} onToggle={jest.fn()} ref={ref} />);

    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('has a 44 px target around the 24 px glyph, which stays decorative', () => {
    const { container } = renderShell(<MenuToggleButton open={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('button')).toHaveStyle({ width: '44px', height: '44px' });
    expect(container).toContainHTML('aria-hidden="true"');
    expect(container).not.toContainHTML('MuiTouchRipple');
  });
});
