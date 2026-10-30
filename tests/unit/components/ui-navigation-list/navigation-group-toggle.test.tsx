import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import NavigationGroupToggle from '@/components/ui-navigation-list/navigation-group-toggle';
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

describe('NavigationGroupToggle', () => {
  it('reports an expanded group and offers to collapse it', () => {
    renderShell(
      <NavigationGroupToggle
        layout="desktop"
        expanded
        controls="settings-list"
        onToggle={jest.fn()}
      />
    );

    const toggle = screen.getByRole('button', { name: 'Collapse Settings' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', 'settings-list');
  });

  it('reports a collapsed group, offers to expand it and controls no unmounted list', () => {
    renderShell(
      <NavigationGroupToggle
        layout="desktop"
        expanded={false}
        controls="settings-list"
        onToggle={jest.fn()}
      />
    );

    const toggle = screen.getByRole('button', { name: 'Expand Settings' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).not.toHaveAttribute('aria-controls');
  });

  it('speaks uk names', () => {
    renderShell(
      <NavigationGroupToggle layout="tablet" expanded controls="x" onToggle={jest.fn()} />,
      { locale: 'uk' }
    );

    expect(screen.getByRole('button', { name: 'Згорнути налаштування' })).toBeInTheDocument();
  });

  it('runs its handler on click, Enter and Space and keeps focus on itself', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    renderShell(
      <NavigationGroupToggle layout="desktop" expanded controls="x" onToggle={onToggle} />
    );

    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onToggle).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it.each([
    [true, 'rotate(90deg)'],
    [false, 'rotate(-90deg)'],
  ])('points the glyph with %s expanded as %s', (expanded, transform) => {
    renderShell(
      <NavigationGroupToggle
        layout="desktop"
        expanded={expanded}
        controls="x"
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('img', { hidden: true })).toHaveStyle({ transform });
  });

  it.each([
    ['desktop', '20px', '192px', '19px'],
    ['tablet', '24px', '190px', '24px'],
  ] as const)('places the %s toggle at its Figma box', (layout, size, left, top) => {
    renderShell(
      <NavigationGroupToggle layout={layout} expanded controls="x" onToggle={jest.fn()} />
    );

    expect(screen.getByRole('button')).toHaveStyle({ width: size, height: size, left, top });
  });
});
