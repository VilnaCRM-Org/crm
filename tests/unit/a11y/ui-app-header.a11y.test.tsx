import UIAppHeader from '@/components/ui-app-header';
import renderShell from '@tests/unit/utils/render-shell';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('UIAppHeader a11y', () => {
  it.each(['desktop', 'tablet', 'mobile'] as const)('has no violation at %s', async (layout) => {
    const { container } = renderShell(<UIAppHeader layout={layout} />, { locale: 'uk' });

    await expectNoA11yViolations(container);
  });

  it.each(['desktop', 'tablet'] as const)(
    'has no violation at %s with the story badge counts',
    async (layout) => {
      const { container } = renderShell(
        <UIAppHeader layout={layout} badgeCounts={{ notifications: 1, tasks: 8 }} />
      );

      await expectNoA11yViolations(container);
    }
  );
});
