import HeaderBadge from '@/components/ui-app-header/header-badge';
import HeaderIconButton from '@/components/ui-app-header/header-icon-button';
import renderShell from '@tests/unit/utils/render-shell';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const disclosure = {
  expanded: false,
  controls: 'notification-history',
  describedBy: '4 unread notifications',
  onToggle: jest.fn(),
};

describe('enabled bell accessibility', () => {
  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'has no axe violations at %s, collapsed and expanded',
    async (layout) => {
      const view = renderShell(
        <main>
          <HeaderIconButton
            layout={layout}
            kind="notifications"
            count={4}
            disclosure={disclosure}
          />
          <div id="notification-history" hidden />
        </main>
      );
      await expectNoA11yViolations(view.container);
      view.unmount();

      const { container } = renderShell(
        <main>
          <HeaderIconButton
            layout={layout}
            kind="notifications"
            count={4}
            disclosure={{ ...disclosure, expanded: true }}
          />
          <div id="notification-history" />
        </main>
      );
      await expectNoA11yViolations(container);
    }
  );

  it('has no axe violations without a description or a count', async () => {
    const { container } = renderShell(
      <main>
        <HeaderIconButton
          layout="desktop"
          kind="notifications"
          disclosure={{ ...disclosure, describedBy: undefined }}
        />
        <div id="notification-history" hidden />
      </main>
    );

    await expectNoA11yViolations(container);
  });

  it('has no axe violations for the alert badge on its own', async () => {
    const { container } = renderShell(
      <main>
        <HeaderBadge count={4} tone="alert" />
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
