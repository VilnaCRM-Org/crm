import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import UIShellContent from '@/components/ui-shell-content';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('UIShellContent', () => {
  it('renders its children inside one box', () => {
    render(
      <UIShellContent>
        <h1>Page</h1>
      </UIShellContent>
    );

    const [, box] = screen.getAllByRole('generic');

    expect(box?.tagName).toBe('DIV');
    expect(
      within(box as HTMLElement).getByRole('heading', { level: 1, name: 'Page' })
    ).toBeInTheDocument();
  });

  it('adds no landmark or role, leaving main to AppLayout', () => {
    render(<UIShellContent>Page</UIShellContent>);

    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('generic')).toHaveLength(2);
  });

  it('fills the width with its insets inside the box', () => {
    render(<UIShellContent>Page</UIShellContent>);

    expect(screen.getByText('Page')).toHaveStyle({ boxSizing: 'border-box', width: '100%' });
  });

  it('has no axe violations inside a main landmark', async () => {
    const { container } = render(
      <main>
        <UIShellContent>
          <h1>Page</h1>
        </UIShellContent>
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
